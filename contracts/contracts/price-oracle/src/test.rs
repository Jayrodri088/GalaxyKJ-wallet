#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, Symbol};

fn create_test_env() -> (Env, Address, Address, Address) {
    let env = Env::default();
    let admin = Address::generate(&env);
    let oracle1 = Address::generate(&env);
    let oracle2 = Address::generate(&env);
    (env, admin, oracle1, oracle2)
}

fn init_contract(env: &Env, admin: &Address) -> Result<(), Symbol> {
    PriceOracle::initialize(env.clone(), admin.clone())
}

fn create_test_registration(env: &Env, node_address: &Address) -> NodeRegistration {
    NodeRegistration {
        node_address: node_address.clone(),
        stake_amount: 2000_0000000, // 2000 XLM
        metadata: Symbol::new(env, "test_oracle_node"),
    }
}

fn create_test_price_update(env: &Env, asset: &str, price: u64) -> PriceUpdateRequest {
    PriceUpdateRequest {
        asset_symbol: Symbol::new(env, asset),
        price,
        timestamp: env.ledger().timestamp(),
        signature: Symbol::new(env, "test_signature_64_chars_long_placeholder_for_real_signature"),
    }
}

#[test]
fn test_contract_initialization() {
    let (env, admin, _, _) = create_test_env();
    
    let result = init_contract(&env, &admin);
    assert!(result.is_ok());
    
    // Test double initialization fails
    let result = init_contract(&env, &admin);
    assert_eq!(result, Err(Symbol::new(&env, "already_initialized")));
}

#[test]
fn test_oracle_node_registration() {
    let (env, admin, oracle1, _) = create_test_env();
    init_contract(&env, &admin).unwrap();
    
    let registration = create_test_registration(&env, &oracle1);
    let result = PriceOracle::register_oracle_node(env.clone(), oracle1.clone(), registration);
    assert!(result.is_ok());
    
    // Verify node is registered
    let node_info = PriceOracle::get_oracle_node_info(env.clone(), oracle1.clone());
    assert!(node_info.is_some());
    assert_eq!(node_info.unwrap().address, oracle1);
}

#[test]
fn test_oracle_node_registration_insufficient_stake() {
    let (env, admin, oracle1, _) = create_test_env();
    init_contract(&env, &admin).unwrap();
    
    let mut registration = create_test_registration(&env, &oracle1);
    registration.stake_amount = 500_0000000; // Below minimum
    
    let result = PriceOracle::register_oracle_node(env.clone(), oracle1.clone(), registration);
    assert_eq!(result, Err(Symbol::new(&env, "insufficient_stake")));
}

#[test]
fn test_oracle_node_double_registration() {
    let (env, admin, oracle1, _) = create_test_env();
    init_contract(&env, &admin).unwrap();
    
    let registration = create_test_registration(&env, &oracle1);
    PriceOracle::register_oracle_node(env.clone(), oracle1.clone(), registration.clone()).unwrap();
    
    let result = PriceOracle::register_oracle_node(env.clone(), oracle1.clone(), registration);
    assert_eq!(result, Err(Symbol::new(&env, "node_already_registered")));
}

#[test]
fn test_price_submission_valid() {
    let (env, admin, oracle1, _) = create_test_env();
    init_contract(&env, &admin).unwrap();
    
    let registration = create_test_registration(&env, &oracle1);
    PriceOracle::register_oracle_node(env.clone(), oracle1.clone(), registration).unwrap();
    
    let price_update = create_test_price_update(&env, "XLM", 1000000);
    let result = PriceOracle::submit_price(env.clone(), oracle1.clone(), price_update);
    assert!(result.is_ok());
}

#[test]
fn test_price_submission_unregistered_node() {
    let (env, admin, oracle1, _) = create_test_env();
    init_contract(&env, &admin).unwrap();
    
    let price_update = create_test_price_update(&env, "XLM", 1000000);
    let result = PriceOracle::submit_price(env.clone(), oracle1.clone(), price_update);
    assert_eq!(result, Err(Symbol::new(&env, "unregistered_node")));
}

#[test]
fn test_price_submission_invalid_price() {
    let (env, admin, oracle1, _) = create_test_env();
    init_contract(&env, &admin).unwrap();
    
    let registration = create_test_registration(&env, &oracle1);
    PriceOracle::register_oracle_node(env.clone(), oracle1.clone(), registration).unwrap();
    
    let price_update = create_test_price_update(&env, "XLM", 0); // Invalid price
    let result = PriceOracle::submit_price(env.clone(), oracle1.clone(), price_update);
    assert_eq!(result, Err(Symbol::new(&env, "invalid_price_zero")));
}

#[test]
fn test_price_aggregation_with_multiple_oracles() {
    let (env, admin, oracle1, oracle2) = create_test_env();
    init_contract(&env, &admin).unwrap();
    
    // Register multiple oracles
    let registration1 = create_test_registration(&env, &oracle1);
    let registration2 = create_test_registration(&env, &oracle2);
    PriceOracle::register_oracle_node(env.clone(), oracle1.clone(), registration1).unwrap();
    PriceOracle::register_oracle_node(env.clone(), oracle2.clone(), registration2).unwrap();
    
    // Add a third oracle for minimum aggregation
    let oracle3 = Address::generate(&env);
    let registration3 = create_test_registration(&env, &oracle3);
    PriceOracle::register_oracle_node(env.clone(), oracle3.clone(), registration3).unwrap();
    
    // Submit prices from multiple oracles
    let price_update1 = create_test_price_update(&env, "XLM", 1000000);
    let price_update2 = create_test_price_update(&env, "XLM", 1010000);
    let price_update3 = create_test_price_update(&env, "XLM", 1005000);
    
    PriceOracle::submit_price(env.clone(), oracle1.clone(), price_update1).unwrap();
    PriceOracle::submit_price(env.clone(), oracle2.clone(), price_update2).unwrap();
    PriceOracle::submit_price(env.clone(), oracle3.clone(), price_update3).unwrap();
    
    // Get aggregated price
    let result = PriceOracle::get_price(env.clone(), Symbol::new(&env, "XLM"));
    assert!(result.is_ok());
    
    let aggregated_price = result.unwrap();
    assert_eq!(aggregated_price.asset_symbol, Symbol::new(&env, "XLM"));
    assert_eq!(aggregated_price.num_sources, 3);
}

#[test]
fn test_supported_assets() {
    let (env, admin, _, _) = create_test_env();
    init_contract(&env, &admin).unwrap();
    
    let xlm_symbol = Symbol::new(&env, "XLM");
    let btc_symbol = Symbol::new(&env, "BTC");
    
    // Add supported assets
    PriceOracle::add_supported_asset(env.clone(), admin.clone(), xlm_symbol.clone()).unwrap();
    PriceOracle::add_supported_asset(env.clone(), admin.clone(), btc_symbol.clone()).unwrap();
    
    let supported_assets = PriceOracle::get_supported_assets(env.clone());
    assert_eq!(supported_assets.len(), 2);
    assert!(supported_assets.iter().any(|asset| asset == xlm_symbol));
    assert!(supported_assets.iter().any(|asset| asset == btc_symbol));
}

#[test]
fn test_oracle_node_deactivation() {
    let (env, admin, oracle1, _) = create_test_env();
    init_contract(&env, &admin).unwrap();
    
    let registration = create_test_registration(&env, &oracle1);
    PriceOracle::register_oracle_node(env.clone(), oracle1.clone(), registration).unwrap();
    
    // Verify node is active
    let node_info = PriceOracle::get_oracle_node_info(env.clone(), oracle1.clone()).unwrap();
    assert!(node_info.is_active);
    
    // Deactivate node
    PriceOracle::deactivate_oracle_node(env.clone(), admin.clone(), oracle1.clone()).unwrap();
    
    // Verify node is deactivated
    let node_info = PriceOracle::get_oracle_node_info(env.clone(), oracle1.clone()).unwrap();
    assert!(!node_info.is_active);
}

#[test]
fn test_emergency_stop() {
    let (env, admin, oracle1, _) = create_test_env();
    init_contract(&env, &admin).unwrap();
    
    let registration = create_test_registration(&env, &oracle1);
    PriceOracle::register_oracle_node(env.clone(), oracle1.clone(), registration).unwrap();
    
    // Enable emergency stop
    PriceOracle::set_emergency_stop(env.clone(), admin.clone(), true).unwrap();
    
    // Try to submit price during emergency stop
    let price_update = create_test_price_update(&env, "XLM", 1000000);
    let result = PriceOracle::submit_price(env.clone(), oracle1.clone(), price_update);
    assert_eq!(result, Err(Symbol::new(&env, "emergency_stop_active")));
    
    // Try to get price during emergency stop
    let result = PriceOracle::get_price(env.clone(), Symbol::new(&env, "XLM"));
    assert_eq!(result, Err(Symbol::new(&env, "emergency_stop_active")));
    
    // Disable emergency stop
    PriceOracle::set_emergency_stop(env.clone(), admin.clone(), false).unwrap();
    
    // Now price submission should work
    let price_update = create_test_price_update(&env, "XLM", 1000000);
    let result = PriceOracle::submit_price(env.clone(), oracle1.clone(), price_update);
    assert!(result.is_ok());
}

#[test]
fn test_unauthorized_admin_actions() {
    let (env, admin, oracle1, _) = create_test_env();
    init_contract(&env, &admin).unwrap();
    
    let unauthorized = Address::generate(&env);
    
    // Try to add supported asset with unauthorized address
    let result = PriceOracle::add_supported_asset(
        env.clone(),
        unauthorized.clone(),
        Symbol::new(&env, "XLM"),
    );
    assert_eq!(result, Err(Symbol::new(&env, "unauthorized")));
    
    // Try to deactivate node with unauthorized address
    let result = PriceOracle::deactivate_oracle_node(
        env.clone(),
        unauthorized.clone(),
        oracle1.clone(),
    );
    assert_eq!(result, Err(Symbol::new(&env, "unauthorized")));
    
    // Try to set emergency stop with unauthorized address
    let result = PriceOracle::set_emergency_stop(env.clone(), unauthorized, true);
    assert_eq!(result, Err(Symbol::new(&env, "unauthorized")));
}

#[test]
fn test_price_history() {
    let (env, admin, oracle1, oracle2) = create_test_env();
    init_contract(&env, &admin).unwrap();
    
    // Register oracles
    let registration1 = create_test_registration(&env, &oracle1);
    let registration2 = create_test_registration(&env, &oracle2);
    PriceOracle::register_oracle_node(env.clone(), oracle1.clone(), registration1).unwrap();
    PriceOracle::register_oracle_node(env.clone(), oracle2.clone(), registration2).unwrap();
    
    // Add third oracle for minimum aggregation
    let oracle3 = Address::generate(&env);
    let registration3 = create_test_registration(&env, &oracle3);
    PriceOracle::register_oracle_node(env.clone(), oracle3.clone(), registration3).unwrap();
    
    // Submit multiple price updates
    for i in 1..=5 {
        let price = 1000000 + (i * 1000);
        let price_update1 = create_test_price_update(&env, "XLM", price);
        let price_update2 = create_test_price_update(&env, "XLM", price + 500);
        let price_update3 = create_test_price_update(&env, "XLM", price + 250);
        
        PriceOracle::submit_price(env.clone(), oracle1.clone(), price_update1).unwrap();
        PriceOracle::submit_price(env.clone(), oracle2.clone(), price_update2).unwrap();
        PriceOracle::submit_price(env.clone(), oracle3.clone(), price_update3).unwrap();
        
        // Advance ledger time to create distinct timestamps
        env.ledger().with_mut(|li| {
            li.timestamp += 60; // Add 1 minute
        });
    }
    
    // Get price history
    let history = PriceOracle::get_price_history(env.clone(), Symbol::new(&env, "XLM"), 10);
    assert!(history.len() > 0);
}

#[test]
fn test_rate_limiting() {
    let (env, admin, oracle1, _) = create_test_env();
    init_contract(&env, &admin).unwrap();
    
    let registration = create_test_registration(&env, &oracle1);
    PriceOracle::register_oracle_node(env.clone(), oracle1.clone(), registration).unwrap();
    
    // Submit many price updates rapidly
    for i in 0..MAX_SUBMISSIONS_PER_HOUR + 5 {
        let price_update = create_test_price_update(&env, "XLM", 1000000 + i as u64);
        let result = PriceOracle::submit_price(env.clone(), oracle1.clone(), price_update);
        
        if i < MAX_SUBMISSIONS_PER_HOUR {
            assert!(result.is_ok(), "Submission {} should succeed", i);
        } else {
            assert_eq!(result, Err(Symbol::new(&env, "rate_limit_exceeded")));
        }
    }
}

#[test]
fn test_price_data_validation() {
    let env = Env::default();
    
    // Test PriceData creation and validation
    let node_address = Address::generate(&env);
    let price_data = PriceData::new(
        &env,
        Symbol::new(&env, "XLM"),
        1000000,
        node_address,
        80,
    );
    
    assert!(price_data.is_valid());
    assert!(!price_data.is_stale(&env));
    
    // Test invalid price data
    let invalid_price_data = PriceData {
        asset_symbol: Symbol::new(&env, "XLM"),
        price: 0, // Invalid price
        timestamp: env.ledger().timestamp(),
        oracle_node: node_address,
        confidence: 50, // Below minimum confidence
    };
    
    assert!(!invalid_price_data.is_valid());
}

#[test]
fn test_aggregated_price_reliability() {
    let env = Env::default();
    
    // Test reliable aggregated price
    let reliable_price = AggregatedPrice::new(
        &env,
        Symbol::new(&env, "XLM"),
        1000000,
        5, // 5 sources
        85, // 85% confidence
        3,  // 3% deviation
    );
    
    assert!(reliable_price.is_reliable());
    
    // Test unreliable aggregated price
    let unreliable_price = AggregatedPrice::new(
        &env,
        Symbol::new(&env, "XLM"),
        1000000,
        2, // Only 2 sources
        60, // Low confidence
        15, // High deviation
    );
    
    assert!(!unreliable_price.is_reliable());
}

#[test]
fn test_oracle_node_eligibility() {
    let env = Env::default();
    let node_address = Address::generate(&env);
    
    // Test eligible node
    let eligible_node = OracleNode::new(&env, node_address.clone(), 2000_0000000);
    assert!(eligible_node.is_eligible(&env));
    
    // Test ineligible node (insufficient stake)
    let mut ineligible_node = OracleNode::new(&env, node_address.clone(), 500_0000000);
    ineligible_node.stake_amount = 500_0000000; // Below minimum
    assert!(!ineligible_node.is_eligible(&env));
    
    // Test inactive node
    let mut inactive_node = OracleNode::new(&env, node_address, 2000_0000000);
    inactive_node.is_active = false;
    assert!(!inactive_node.is_eligible(&env));
}

#[test]
fn test_fallback_price() {
    let (env, admin, oracle1, oracle2) = create_test_env();
    init_contract(&env, &admin).unwrap();
    
    // Register oracles and submit prices to create history
    let registration1 = create_test_registration(&env, &oracle1);
    let registration2 = create_test_registration(&env, &oracle2);
    PriceOracle::register_oracle_node(env.clone(), oracle1.clone(), registration1).unwrap();
    PriceOracle::register_oracle_node(env.clone(), oracle2.clone(), registration2).unwrap();
    
    let oracle3 = Address::generate(&env);
    let registration3 = create_test_registration(&env, &oracle3);
    PriceOracle::register_oracle_node(env.clone(), oracle3.clone(), registration3).unwrap();
    
    // Submit prices to create aggregated price history
    let price_update1 = create_test_price_update(&env, "XLM", 1000000);
    let price_update2 = create_test_price_update(&env, "XLM", 1010000);
    let price_update3 = create_test_price_update(&env, "XLM", 1005000);
    
    PriceOracle::submit_price(env.clone(), oracle1.clone(), price_update1).unwrap();
    PriceOracle::submit_price(env.clone(), oracle2.clone(), price_update2).unwrap();
    PriceOracle::submit_price(env.clone(), oracle3.clone(), price_update3).unwrap();
    
    // Wait for the price to become stale for regular get_price
    env.ledger().with_mut(|li| {
        li.timestamp += PRICE_STALENESS_THRESHOLD + 100;
    });
    
    // Regular get_price should fail due to stale data
    let result = PriceOracle::get_price(env.clone(), Symbol::new(&env, "XLM"));
    assert_eq!(result, Err(Symbol::new(&env, "stale_price")));
    
    // But fallback price should still work
    let fallback_result = PriceOracle::get_fallback_price(env.clone(), Symbol::new(&env, "XLM"));
    assert!(fallback_result.is_ok());
}