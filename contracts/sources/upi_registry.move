module p2m_system::upi_registry {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use std::error;
    use aptos_framework::account;
    use aptos_framework::event;
    use aptos_framework::table::{Self, Table};
    use aptos_framework::timestamp;


    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_NOT_ADMIN: u64 = 3;
    const E_UPI_ALREADY_REGISTERED: u64 = 4;
    const E_UPI_NOT_FOUND: u64 = 5;
    const E_MERCHANT_NOT_FOUND: u64 = 6;
    const E_INVALID_UPI_FORMAT: u64 = 7;
    const E_UNAUTHORIZED: u64 = 8;

    /// UPI Registry resource stored at module publisher's address
    struct UPIRegistry has key {
        /// Mapping from UPI ID to merchant address
        upi_to_address: Table<String, address>,
        /// Mapping from merchant address to UPI IDs
        address_to_upis: Table<address, vector<String>>,
        /// Merchant registration data
        merchants: Table<address, MerchantInfo>,
        /// Admin addresses with management permissions
        admins: vector<address>,
        /// Registry statistics
        total_merchants: u64,
        total_upi_mappings: u64,
        /// Events
        upi_registration_events: event::EventHandle<UPIRegistrationEvent>,
        merchant_registration_events: event::EventHandle<MerchantRegistrationEvent>,
        upi_removal_events: event::EventHandle<UPIRemovalEvent>,
    }

    /// Merchant information structure
    struct MerchantInfo has store, copy {
        merchant_address: address,
        business_name: String,
        contact_info: String,
        registration_timestamp: u64,
        is_active: bool,
        kyc_verified: bool,
    }

    /// Events
    struct UPIRegistrationEvent has drop, store {
        merchant_address: address,
        upi_id: String,
        timestamp: u64,
    }

    struct MerchantRegistrationEvent has drop, store {
        merchant_address: address,
        business_name: String,
        timestamp: u64,
    }

    struct UPIRemovalEvent has drop, store {
        merchant_address: address,
        upi_id: String,
        timestamp: u64,
    }

    /// Initialize the UPI Registry (called once by module publisher)
    public entry fun initialize(admin: &signer) {
        let admin_address = signer::address_of(admin);
        assert!(!exists<UPIRegistry>(admin_address), error::already_exists(E_ALREADY_INITIALIZED));

        let registry = UPIRegistry {
            upi_to_address: table::new(),
            address_to_upis: table::new(),
            merchants: table::new(),
            admins: vector[admin_address],
            total_merchants: 0,
            total_upi_mappings: 0,
            upi_registration_events: account::new_event_handle<UPIRegistrationEvent>(admin),
            merchant_registration_events: account::new_event_handle<MerchantRegistrationEvent>(admin),
            upi_removal_events: account::new_event_handle<UPIRemovalEvent>(admin),
        };

        move_to(admin, registry);
    }

    /// Register a new merchant
    public entry fun register_merchant(
        merchant: &signer,
        business_name: String,
        contact_info: String,
    ) acquires UPIRegistry {
        let merchant_address = signer::address_of(merchant);
        let registry = borrow_global_mut<UPIRegistry>(@p2m_system);
        
        assert!(!table::contains(&registry.merchants, merchant_address), error::already_exists(E_UPI_ALREADY_REGISTERED));

        let merchant_info = MerchantInfo {
            merchant_address,
            business_name: business_name,
            contact_info,
            registration_timestamp: timestamp::now_seconds(),
            is_active: true,
            kyc_verified: false,
        };

        table::add(&mut registry.merchants, merchant_address, merchant_info);
        table::add(&mut registry.address_to_upis, merchant_address, vector::empty<String>());
        registry.total_merchants = registry.total_merchants + 1;

        event::emit_event(&mut registry.merchant_registration_events, MerchantRegistrationEvent {
            merchant_address,
            business_name,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Register UPI ID for a merchant
    public entry fun register_upi(
        merchant: &signer,
        upi_id: String,
    ) acquires UPIRegistry {
        let merchant_address = signer::address_of(merchant);
        let registry = borrow_global_mut<UPIRegistry>(@p2m_system);
        
        // Validate merchant is registered
        assert!(table::contains(&registry.merchants, merchant_address), error::not_found(E_MERCHANT_NOT_FOUND));
        
        // Validate UPI ID format (basic validation)
        assert!(string::length(&upi_id) > 0, error::invalid_argument(E_INVALID_UPI_FORMAT));
        
        // Check if UPI ID is already registered
        assert!(!table::contains(&registry.upi_to_address, upi_id), error::already_exists(E_UPI_ALREADY_REGISTERED));

        // Add UPI mapping
        table::add(&mut registry.upi_to_address, upi_id, merchant_address);
        
        // Add to merchant's UPI list
        let merchant_upis = table::borrow_mut(&mut registry.address_to_upis, merchant_address);
        vector::push_back(merchant_upis, upi_id);
        
        registry.total_upi_mappings = registry.total_upi_mappings + 1;

        event::emit_event(&mut registry.upi_registration_events, UPIRegistrationEvent {
            merchant_address,
            upi_id,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Remove UPI ID (merchant or admin only)
    public entry fun remove_upi(
        caller: &signer,
        upi_id: String,
    ) acquires UPIRegistry {
        let caller_address = signer::address_of(caller);
        let registry = borrow_global_mut<UPIRegistry>(@p2m_system);
        
        assert!(table::contains(&registry.upi_to_address, upi_id), error::not_found(E_UPI_NOT_FOUND));
        
        let merchant_address = *table::borrow(&registry.upi_to_address, upi_id);
        
        // Check authorization (merchant owner or admin)
        assert!(
            caller_address == merchant_address || vector::contains(&registry.admins, &caller_address),
            error::permission_denied(E_UNAUTHORIZED)
        );

        // Remove from mappings
        table::remove(&mut registry.upi_to_address, upi_id);
        
        let merchant_upis = table::borrow_mut(&mut registry.address_to_upis, merchant_address);
        let (found, index) = vector::index_of(merchant_upis, &upi_id);
        if (found) {
            vector::remove(merchant_upis, index);
        };
        
        registry.total_upi_mappings = registry.total_upi_mappings - 1;

        event::emit_event(&mut registry.upi_removal_events, UPIRemovalEvent {
            merchant_address,
            upi_id,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Add admin (admin only)
    public entry fun add_admin(
        admin: &signer,
        new_admin: address,
    ) acquires UPIRegistry {
        let admin_address = signer::address_of(admin);
        let registry = borrow_global_mut<UPIRegistry>(@p2m_system);
        
        assert!(vector::contains(&registry.admins, &admin_address), error::permission_denied(E_NOT_ADMIN));
        assert!(!vector::contains(&registry.admins, &new_admin), error::already_exists(E_UPI_ALREADY_REGISTERED));
        
        vector::push_back(&mut registry.admins, new_admin);
    }

    // View functions
    
    // Get merchant address by UPI ID
    #[view]
    public fun get_merchant_by_upi(upi_id: String): address acquires UPIRegistry {
        let registry = borrow_global<UPIRegistry>(@p2m_system);
        assert!(table::contains(&registry.upi_to_address, upi_id), error::not_found(E_UPI_NOT_FOUND));
        *table::borrow(&registry.upi_to_address, upi_id)
    }

    // Get all UPI IDs for a merchant
    #[view]
    public fun get_merchant_upis(merchant_address: address): vector<String> acquires UPIRegistry {
        let registry = borrow_global<UPIRegistry>(@p2m_system);
        assert!(table::contains(&registry.address_to_upis, merchant_address), error::not_found(E_MERCHANT_NOT_FOUND));
        *table::borrow(&registry.address_to_upis, merchant_address)
    }

    // Get merchant info
    #[view]
    public fun get_merchant_info(merchant_address: address): MerchantInfo acquires UPIRegistry {
        let registry = borrow_global<UPIRegistry>(@p2m_system);
        assert!(table::contains(&registry.merchants, merchant_address), error::not_found(E_MERCHANT_NOT_FOUND));
        *table::borrow(&registry.merchants, merchant_address)
    }

    // Check if UPI ID exists
    #[view]
    public fun upi_exists(upi_id: String): bool acquires UPIRegistry {
        let registry = borrow_global<UPIRegistry>(@p2m_system);
        table::contains(&registry.upi_to_address, upi_id)
    }

    // Get registry statistics
    #[view]
    public fun get_registry_stats(): (u64, u64) acquires UPIRegistry {
        let registry = borrow_global<UPIRegistry>(@p2m_system);
        (registry.total_merchants, registry.total_upi_mappings)
    }

    // Check if address is admin
    #[view]
    public fun is_admin(address: address): bool acquires UPIRegistry {
        let registry = borrow_global<UPIRegistry>(@p2m_system);
        vector::contains(&registry.admins, &address)
    }
}