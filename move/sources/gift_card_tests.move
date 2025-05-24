#[test_only]
module aptos_gifts::gift_card_tests {
    use std::signer;
    use std::string;

    use std::vector;
    use aptos_framework::account;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;

    use aptos_gifts::gift_card::{Self, GiftCardStore};

    // Test constants
    const GIFT_AMOUNT: u64 = 100_000_000; // 1 APT
    const SMALL_AMOUNT: u64 = 100; // Below minimum

    // Error messages
    const ERR_BALANCE_MISMATCH: u64 = 1;
    const ERR_GIFT_NOT_CREATED: u64 = 2;
    const ERR_GIFT_NOT_CLAIMED: u64 = 3;

    #[test(creator = @0x1234)]
    public fun test_init_gift_store(creator: &signer) {
        // Create test account
        let creator_addr = signer::address_of(creator);
        
        // Initialize gift store
        gift_card::init_gift_store(creator);
        
        // Verify store exists
        assert!(exists<GiftCardStore>(creator_addr), 0);
    }

    #[test(aptos = @0x1, creator = @0x1234, recipient = @0x123)]
    public fun test_create_gift(
        aptos: &signer,
        creator: &signer,
        recipient: &signer
    ) {
        // Set up accounts
        let creator_addr = signer::address_of(creator);
        let recipient_addr = signer::address_of(recipient);
        
        // Set up test coins
        coin::register<AptosCoin>(creator);
        let coins = coin::mint<AptosCoin>(aptos, GIFT_AMOUNT);
        coin::deposit(creator_addr, coins);
        
        // Create gift
        let message = string::utf8(b"Happy Birthday!");
        gift_card::create_gift(creator, recipient_addr, GIFT_AMOUNT, message);
        
        // Verify gift was created
        let gifts = gift_card::get_sent_gifts(creator_addr);
        assert!(vector::length(&gifts) == 1, ERR_GIFT_NOT_CREATED);
        
        // Verify gift details
        let gift = vector::borrow(&gifts, 0);
        assert!(gift.amount == GIFT_AMOUNT, ERR_BALANCE_MISMATCH);
        assert!(gift.recipient == recipient_addr, 0);
        assert!(!gift.claimed, 0);
    }

    #[test(aptos = @0x1, creator = @0x1234, recipient = @0x123)]
    #[expected_failure(abort_code = gift_card::EZERO_AMOUNT)]
    public fun test_create_gift_small_amount(
        aptos: &signer,
        creator: &signer,
        recipient: &signer
    ) {
        // Set up accounts
        let creator_addr = signer::address_of(creator);
        let recipient_addr = signer::address_of(recipient);
        
        // Set up test coins
        coin::register<AptosCoin>(creator);
        let coins = coin::mint<AptosCoin>(aptos, SMALL_AMOUNT);
        coin::deposit(creator_addr, coins);
        
        // Try to create gift with amount below minimum
        let message = string::utf8(b"Small gift");
        gift_card::create_gift(creator, recipient_addr, SMALL_AMOUNT, message);
    }

    #[test(aptos = @0x1, creator = @0x1234, recipient = @0x123)]
    public fun test_claim_gift(
        aptos: &signer,
        creator: &signer,
        recipient: &signer
    ) {
        // Set up accounts
        let creator_addr = signer::address_of(creator);
        let recipient_addr = signer::address_of(recipient);
        
        // Set up test coins
        coin::register<AptosCoin>(creator);
        coin::register<AptosCoin>(recipient);
        let coins = coin::mint<AptosCoin>(aptos, GIFT_AMOUNT);
        coin::deposit(creator_addr, coins);
        
        // Create gift
        let message = string::utf8(b"Test gift");
        gift_card::create_gift(creator, recipient_addr, GIFT_AMOUNT, message);
        
        // Get gift ID
        let gifts = gift_card::get_sent_gifts(creator_addr);
        let gift = vector::borrow(&gifts, 0);
        let gift_id = gift.id;
        
        // Claim gift
        gift_card::claim_gift(recipient, creator_addr, gift_id);
        
        // Verify gift was claimed
        let gifts_after = gift_card::get_sent_gifts(creator_addr);
        let gift_after = vector::borrow(&gifts_after, 0);
        assert!(gift_after.claimed, ERR_GIFT_NOT_CLAIMED);
        
        // Verify recipient balance
        let recipient_balance = coin::balance<AptosCoin>(recipient_addr);
        assert!(recipient_balance == GIFT_AMOUNT, ERR_BALANCE_MISMATCH);
    }

    #[test(aptos = @0x1, creator = @0x1234, recipient = @0x123)]
    public fun test_get_claimable_gifts(
        aptos: &signer,
        creator: &signer,
        recipient: &signer
    ) {
        // Set up accounts
        let creator_addr = signer::address_of(creator);
        let recipient_addr = signer::address_of(recipient);
        
        // Set up test coins
        coin::register<AptosCoin>(creator);
        let coins = coin::mint<AptosCoin>(aptos, GIFT_AMOUNT * 2);
        coin::deposit(creator_addr, coins);
        
        // Create multiple gifts
        let message = string::utf8(b"Gift 1");
        gift_card::create_gift(creator, recipient_addr, GIFT_AMOUNT, message);
        
        message = string::utf8(b"Gift 2");
        gift_card::create_gift(creator, recipient_addr, GIFT_AMOUNT, message);
        
        // Check claimable gifts
        let claimable = gift_card::get_claimable_gifts(recipient_addr);
        assert!(vector::length(&claimable) == 2, 0);
        
        // Check total unclaimed balance
        let total = gift_card::get_unclaimed_balance(recipient_addr);
        assert!(total == GIFT_AMOUNT * 2, ERR_BALANCE_MISMATCH);
    }
}
