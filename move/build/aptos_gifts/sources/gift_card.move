module aptos_gifts::gift_card {
    use std::error;
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::event::{Self, EventHandle};

    /// Error codes
    const EGIFT_ALREADY_CLAIMED: u64 = 1;
    const EGIFT_NOT_FOUND: u64 = 2;
    const EINVALID_AMOUNT: u64 = 3;
    const EINVALID_RECIPIENT: u64 = 4;
    const EINVALID_SENDER: u64 = 5;
    const EZERO_AMOUNT: u64 = 6;
    const ESELF_GIFT: u64 = 7;
    
    /// Minimum gift amount in Octas (1 Octa = 10^-8 APT)
    const MIN_GIFT_AMOUNT: u64 = 1000; // 0.00001 APT

    /// Event emitted when a gift card is created
    struct CreateGiftEvent has drop, store {
        gift_id: u64,
        sender: address,
        recipient: address,
        amount: u64,
        created_at: u64,
    }

    /// Event emitted when a gift card is claimed
    struct ClaimGiftEvent has drop, store {
        gift_id: u64,
        sender: address,
        recipient: address,
        amount: u64,
        claimed_at: u64,
    }

    /// Represents a single gift card
    struct GiftCard has store, drop, copy {
        id: u64,
        amount: u64,
        message: String,
        sender: address,
        recipient: address,
        claimed: bool,
        created_at: u64,
    }

    /// Store for gift cards and events
    struct GiftCardStore has key {
        next_gift_id: u64,
        gifts: vector<GiftCard>,
        gift_balance: coin::Coin<AptosCoin>,
        create_gift_events: EventHandle<CreateGiftEvent>,
        claim_gift_events: EventHandle<ClaimGiftEvent>
    }

    /// Initialize the GiftCardStore for a new account
    fun init_gift_store(account: &signer) {
        if (!exists<GiftCardStore>(signer::address_of(account))) {
            move_to(account, GiftCardStore {
                next_gift_id: 0,
                gifts: vector::empty<GiftCard>(),
                gift_balance: coin::zero<AptosCoin>(),
                create_gift_events: account::new_event_handle<CreateGiftEvent>(account),
                claim_gift_events: account::new_event_handle<ClaimGiftEvent>(account),
            });
        }
    }

    public entry fun create_gift(
        sender: &signer,
        recipient: address,
        amount: u64,
        message: String
    ) acquires GiftCardStore {
        // Validate inputs
        assert!(amount >= MIN_GIFT_AMOUNT, error::invalid_argument(EZERO_AMOUNT));
        assert!(recipient != @aptos_gifts, error::invalid_argument(EINVALID_RECIPIENT));
        
        let sender_addr = signer::address_of(sender);
        assert!(sender_addr != recipient, error::invalid_argument(ESELF_GIFT));
        
        // Initialize gift store if it doesn't exist
        if (!exists<GiftCardStore>(sender_addr)) {
            init_gift_store(sender);
        };

        // Get the gift store
        let gift_store = borrow_global_mut<GiftCardStore>(sender_addr);
        
        // Transfer coins from sender to gift store
        let coins = coin::withdraw<AptosCoin>(sender, amount);
        coin::merge(&mut gift_store.gift_balance, coins);

        // Create the gift card
        let gift = GiftCard {
            id: gift_store.next_gift_id,
            amount,
            message,
            sender: sender_addr,
            recipient,
            claimed: false,
            created_at: timestamp::now_seconds(),
        };

        // Emit creation event
        event::emit_event(&mut gift_store.create_gift_events, CreateGiftEvent {
            gift_id: gift_store.next_gift_id,
            sender: sender_addr,
            recipient,
            amount,
            created_at: timestamp::now_seconds(),
        });

        // Add gift to store and increment ID
        vector::push_back(&mut gift_store.gifts, gift);
        gift_store.next_gift_id = gift_store.next_gift_id + 1;
    }

    public entry fun claim_gift(
        recipient: &signer,
        sender: address,
        gift_id: u64
    ) acquires GiftCardStore {
        let recipient_addr = signer::address_of(recipient);
        
        // Get the gift store
        assert!(exists<GiftCardStore>(sender), error::not_found(EGIFT_NOT_FOUND));
        let gift_store = borrow_global_mut<GiftCardStore>(sender);
        
        // Find and validate the gift
        let len = vector::length(&gift_store.gifts);
        let idx = 0;
        while (idx < len) {
            let gift = vector::borrow_mut(&mut gift_store.gifts, idx);
            if (gift.id == gift_id) {
                assert!(!gift.claimed, error::invalid_state(EGIFT_ALREADY_CLAIMED));
                assert!(gift.recipient == recipient_addr, error::invalid_argument(EINVALID_RECIPIENT));
                
                // Mark as claimed and transfer coins
                gift.claimed = true;
                let gift_store_coins = &mut gift_store.gift_balance;
                let coins = coin::extract(gift_store_coins, gift.amount);
                coin::deposit(recipient_addr, coins);

                // Emit claim event
                event::emit_event(&mut gift_store.claim_gift_events, ClaimGiftEvent {
                    gift_id,
                    sender,
                    recipient: recipient_addr,
                    amount: gift.amount,
                    claimed_at: timestamp::now_seconds(),
                });
                return
            };
            idx = idx + 1;
        };
        
        abort error::not_found(EGIFT_NOT_FOUND)
    }

    #[view]
    public fun get_sent_gifts(sender: address): vector<GiftCard> acquires GiftCardStore {
        if (!exists<GiftCardStore>(sender)) {
            return vector::empty<GiftCard>()
        };
        *&borrow_global<GiftCardStore>(sender).gifts
    }

    #[view]
    public fun get_claimable_gifts(recipient: address): vector<GiftCard> acquires GiftCardStore {
        let claimable = vector::empty<GiftCard>();
        let resource_account = account::create_resource_address(&@aptos_gifts, x"67696674636172645f76315f30");
        
        if (!exists<GiftCardStore>(resource_account)) {
            return claimable
        };

        let store = borrow_global<GiftCardStore>(resource_account);
        let i = 0;
        let len = vector::length(&store.gifts);

        while (i < len) {
            let gift = vector::borrow(&store.gifts, i);
            if (!gift.claimed && gift.recipient == recipient) {
                vector::push_back(&mut claimable, *gift);
            };
            i = i + 1;
        };

        claimable
    }

    #[view]
    public fun get_unclaimed_balance(recipient: address): u64 acquires GiftCardStore {
        let gifts = get_claimable_gifts(recipient);
        let total = 0u64;
        let i = 0;
        let len = vector::length(&gifts);

        while (i < len) {
            let gift = vector::borrow(&gifts, i);
            if (!gift.claimed) {
                total = total + gift.amount;
            };
            i = i + 1;
        };

        total
    }
}
