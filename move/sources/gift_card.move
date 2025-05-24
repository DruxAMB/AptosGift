module aptos_gifts::gift_card {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::account;

    /// Error codes
    const EGIFT_ALREADY_CLAIMED: u64 = 1;
    const EGIFT_NOT_FOUND: u64 = 2;
    const EINVALID_AMOUNT: u64 = 3;
    const EINVALID_RECIPIENT: u64 = 4;

    struct GiftCard has key {
        id: u64,
        amount: u64,
        message: String,
        sender: address,
        recipient: address,
        claimed: bool,
        created_at: u64,
    }

    struct GiftCardStore has key {
        next_gift_id: u64,
        gifts: vector<GiftCard>,
    }

    /// Initialize the GiftCardStore for a new account
    fun init_gift_store(account: &signer) {
        if (!exists<GiftCardStore>(signer::address_of(account))) {
            move_to(account, GiftCardStore {
                next_gift_id: 0,
                gifts: vector::empty<GiftCard>(),
            });
        }
    }

    /// Create a new gift card
    public entry fun create_gift(
        sender: &signer,
        recipient: address,
        amount: u64,
        message: String
    ) {
        let sender_addr = signer::address_of(sender);
        
        // Initialize gift store if it doesn't exist
        if (!exists<GiftCardStore>(sender_addr)) {
            init_gift_store(sender);
        };

        // Get the gift store
        let gift_store = borrow_global_mut<GiftCardStore>(sender_addr);
        
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

        // Transfer coins from sender to module
        let coins = coin::withdraw<AptosCoin>(sender, amount);
        coin::deposit(sender_addr, coins);

        // Add gift to store and increment ID
        vector::push_back(&mut gift_store.gifts, gift);
        gift_store.next_gift_id = gift_store.next_gift_id + 1;
    }

    /// Claim a gift card
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
                let coins = coin::withdraw<AptosCoin>(&sender, gift.amount);
                coin::deposit(recipient_addr, coins);
                return
            };
            idx = idx + 1;
        };
        
        abort error::not_found(EGIFT_NOT_FOUND)
    }

    /// Get all gifts sent by an account
    #[view]
    public fun get_sent_gifts(sender: address): vector<GiftCard> acquires GiftCardStore {
        if (!exists<GiftCardStore>(sender)) {
            return vector::empty<GiftCard>()
        };
        *&borrow_global<GiftCardStore>(sender).gifts
    }

    /// Get all gifts that can be claimed by an account
    #[view]
    public fun get_claimable_gifts(recipient: address): vector<GiftCard> acquires GiftCardStore {
        let claimable = vector::empty<GiftCard>();
        // TODO: Implement logic to scan all gift stores for claimable gifts
        claimable
    }
}
