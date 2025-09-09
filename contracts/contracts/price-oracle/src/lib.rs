#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, Map, Symbol, Vec, log,
};

mod price_data;
mod oracle_node;
mod aggregation;
mod validation;

pub use price_data::*;
pub use oracle_node::*;
pub use aggregation::*;
pub use validation::*;

#[contracttype]
pub enum DataKey {
    OracleNodes,
    RateLimits,
    PriceData(Symbol), // Asset symbol -> Vec<PriceData>
    AggregatedPrices(Symbol), // Asset symbol -> AggregatedPrice
    PriceHistory(Symbol), // Asset symbol -> Vec<AggregatedPrice>
    Admin,
    EmergencyStop,
    SupportedAssets,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ContractConfig {
    pub admin: Address,
    pub emergency_stop: bool,
    pub min_oracle_nodes: u32,
    pub price_update_interval: u64,
}

#[contract]
pub struct PriceOracle;

#[contractimpl]
impl PriceOracle {
    pub fn initialize(env: Env, admin: Address) -> Result<(), Symbol> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Symbol::new(&env, "already_initialized"));
        }

        let config = ContractConfig {
            admin: admin.clone(),
            emergency_stop: false,
            min_oracle_nodes: 3,
            price_update_interval: 60, // 1 minute
        };

        env.storage().instance().set(&DataKey::Admin, &config);
        env.storage().instance().set(&DataKey::OracleNodes, &Map::<Address, OracleNode>::new(&env));
        env.storage().instance().set(&DataKey::RateLimits, &Map::<Address, RateLimitInfo>::new(&env));
        env.storage().instance().set(&DataKey::SupportedAssets, &Vec::<Symbol>::new(&env));

        log!(&env, "Price Oracle initialized with admin: {}", admin);
        Ok(())
    }

    pub fn register_oracle_node(
        env: Env,
        caller: Address,
        registration: NodeRegistration,
    ) -> Result<(), Symbol> {
        caller.require_auth();
        Self::check_emergency_stop(&env)?;

        let mut nodes: Map<Address, OracleNode> = env
            .storage()
            .instance()
            .get(&DataKey::OracleNodes)
            .unwrap_or_else(|| Map::new(&env));

        let mut rate_limits: Map<Address, RateLimitInfo> = env
            .storage()
            .instance()
            .get(&DataKey::RateLimits)
            .unwrap_or_else(|| Map::new(&env));

        NodeManager::register_node(&env, &mut nodes, &mut rate_limits, registration.clone())?;

        env.storage().instance().set(&DataKey::OracleNodes, &nodes);
        env.storage().instance().set(&DataKey::RateLimits, &rate_limits);

        log!(&env, "Oracle node registered: {}", registration.node_address);
        Ok(())
    }

    pub fn submit_price(
        env: Env,
        caller: Address,
        price_update: PriceUpdateRequest,
    ) -> Result<(), Symbol> {
        caller.require_auth();
        Self::check_emergency_stop(&env)?;

        let nodes: Map<Address, OracleNode> = env
            .storage()
            .instance()
            .get(&DataKey::OracleNodes)
            .unwrap_or_else(|| Map::new(&env));

        let mut rate_limits: Map<Address, RateLimitInfo> = env
            .storage()
            .instance()
            .get(&DataKey::RateLimits)
            .unwrap_or_else(|| Map::new(&env));

        // Validate the price update
        ValidationEngine::validate_price_update(
            &env,
            &price_update,
            &nodes,
            &rate_limits,
            &caller,
        )?;

        // Update rate limiting
        if let Some(mut rate_limit) = rate_limits.get(&caller) {
            if !rate_limit.record_submission(&env) {
                return Err(Symbol::new(&env, "rate_limit_exceeded"));
            }
            rate_limits.set(caller.clone(), rate_limit);
        }

        // Store the price data
        let price_data = PriceData::new(
            &env,
            price_update.asset_symbol.clone(),
            price_update.price,
            caller.clone(),
            ValidationEngine::validate_against_historical_data(
                &env,
                price_update.price,
                &price_update.asset_symbol,
                &env.storage().instance()
                    .get(&DataKey::PriceData(price_update.asset_symbol.clone()))
                    .unwrap_or_else(|| Vec::new(&env))
            ).unwrap_or(50),
        );

        let mut price_submissions: Vec<PriceData> = env
            .storage()
            .instance()
            .get(&DataKey::PriceData(price_update.asset_symbol.clone()))
            .unwrap_or_else(|| Vec::new(&env));

        price_submissions.push_back(price_data.clone());

        // Keep only recent submissions (last 24 hours)
        Self::cleanup_old_price_data(&env, &mut price_submissions);

        env.storage().instance().set(
            &DataKey::PriceData(price_update.asset_symbol.clone()),
            &price_submissions,
        );
        env.storage().instance().set(&DataKey::RateLimits, &rate_limits);

        // Try to aggregate prices if we have enough data
        Self::try_aggregate_prices(&env, &price_update.asset_symbol)?;

        log!(&env, "Price submitted for asset: {} by node: {}", 
             price_update.asset_symbol, caller);
        Ok(())
    }

    pub fn get_price(env: Env, asset_symbol: Symbol) -> Result<AggregatedPrice, Symbol> {
        Self::check_emergency_stop(&env)?;

        if let Some(aggregated_price) = env
            .storage()
            .instance()
            .get::<_, AggregatedPrice>(&DataKey::AggregatedPrices(asset_symbol.clone()))
        {
            if !aggregated_price.is_reliable() {
                return Err(Symbol::new(&env, "unreliable_price"));
            }
            
            // Check if price is stale
            let current_time = env.ledger().timestamp();
            if current_time.saturating_sub(aggregated_price.timestamp) > PRICE_STALENESS_THRESHOLD {
                return Err(Symbol::new(&env, "stale_price"));
            }

            return Ok(aggregated_price);
        }

        Err(Symbol::new(&env, "price_not_available"))
    }

    pub fn get_fallback_price(env: Env, asset_symbol: Symbol) -> Result<u64, Symbol> {
        Self::check_emergency_stop(&env)?;

        let price_history: Map<Symbol, Vec<AggregatedPrice>> = env
            .storage()
            .instance()
            .get(&DataKey::PriceHistory(asset_symbol.clone()))
            .unwrap_or_else(|| Map::new(&env));

        PriceAggregator::get_fallback_price(&env, asset_symbol, &price_history)
    }

    pub fn add_supported_asset(
        env: Env,
        caller: Address,
        asset_symbol: Symbol,
    ) -> Result<(), Symbol> {
        caller.require_auth();
        Self::check_admin(&env, &caller)?;

        let mut supported_assets: Vec<Symbol> = env
            .storage()
            .instance()
            .get(&DataKey::SupportedAssets)
            .unwrap_or_else(|| Vec::new(&env));

        if !supported_assets.iter().any(|asset| asset == asset_symbol) {
            supported_assets.push_back(asset_symbol.clone());
            env.storage().instance().set(&DataKey::SupportedAssets, &supported_assets);
        }

        log!(&env, "Asset added to supported list: {}", asset_symbol);
        Ok(())
    }

    pub fn deactivate_oracle_node(
        env: Env,
        caller: Address,
        node_address: Address,
    ) -> Result<(), Symbol> {
        caller.require_auth();
        Self::check_admin(&env, &caller)?;

        let mut nodes: Map<Address, OracleNode> = env
            .storage()
            .instance()
            .get(&DataKey::OracleNodes)
            .unwrap_or_else(|| Map::new(&env));

        NodeManager::deactivate_node(&mut nodes, &node_address)?;
        env.storage().instance().set(&DataKey::OracleNodes, &nodes);

        log!(&env, "Oracle node deactivated: {}", node_address);
        Ok(())
    }

    pub fn set_emergency_stop(
        env: Env,
        caller: Address,
        emergency_stop: bool,
    ) -> Result<(), Symbol> {
        caller.require_auth();
        Self::check_admin(&env, &caller)?;

        let mut config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or_else(|| Symbol::new(&env, "not_initialized"))?;

        config.emergency_stop = emergency_stop;
        env.storage().instance().set(&DataKey::Admin, &config);

        log!(&env, "Emergency stop set to: {}", emergency_stop);
        Ok(())
    }

    pub fn get_oracle_node_info(env: Env, node_address: Address) -> Option<OracleNode> {
        let nodes: Map<Address, OracleNode> = env
            .storage()
            .instance()
            .get(&DataKey::OracleNodes)
            .unwrap_or_else(|| Map::new(&env));

        nodes.get(&node_address)
    }

    pub fn get_supported_assets(env: Env) -> Vec<Symbol> {
        env.storage()
            .instance()
            .get(&DataKey::SupportedAssets)
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn get_price_history(env: Env, asset_symbol: Symbol, limit: u32) -> Vec<AggregatedPrice> {
        let history: Vec<AggregatedPrice> = env
            .storage()
            .instance()
            .get(&DataKey::PriceHistory(asset_symbol))
            .unwrap_or_else(|| Vec::new(&env));

        let limit = limit.min(MAX_HISTORY_ENTRIES);
        let start_index = if history.len() > limit {
            history.len() - limit
        } else {
            0
        };

        let mut result = Vec::new(&env);
        for i in start_index..history.len() {
            if let Some(entry) = history.get(i) {
                result.push_back(entry);
            }
        }

        result
    }

    // Internal helper functions
    fn try_aggregate_prices(env: &Env, asset_symbol: &Symbol) -> Result<(), Symbol> {
        let price_submissions: Vec<PriceData> = env
            .storage()
            .instance()
            .get(&DataKey::PriceData(asset_symbol.clone()))
            .unwrap_or_else(|| Vec::new(env));

        let nodes: Map<Address, OracleNode> = env
            .storage()
            .instance()
            .get(&DataKey::OracleNodes)
            .unwrap_or_else(|| Map::new(env));

        // Only aggregate if we have sufficient recent data
        let recent_submissions = Self::filter_recent_submissions(env, &price_submissions);
        
        let config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or_else(|| Symbol::new(env, "not_initialized"))?;

        if recent_submissions.len() < config.min_oracle_nodes {
            return Ok(()); // Not enough data to aggregate
        }

        match PriceAggregator::aggregate_prices(env, asset_symbol.clone(), &recent_submissions, &nodes) {
            Ok(aggregated_price) => {
                // Store the aggregated price
                env.storage().instance().set(
                    &DataKey::AggregatedPrices(asset_symbol.clone()),
                    &aggregated_price,
                );

                // Update price history
                Self::update_price_history(env, asset_symbol, &aggregated_price);

                // Update oracle node accuracies
                let mut updated_nodes = nodes;
                for submission in recent_submissions.iter() {
                    PriceAggregator::update_oracle_accuracy(
                        &mut updated_nodes,
                        &submission,
                        aggregated_price.price,
                    );
                }
                env.storage().instance().set(&DataKey::OracleNodes, &updated_nodes);

                log!(env, "Price aggregated for asset: {}, price: {}", 
                     asset_symbol, aggregated_price.price);
                Ok(())
            }
            Err(e) => {
                log!(env, "Failed to aggregate prices for asset: {}, error: {}", asset_symbol, e);
                Err(e)
            }
        }
    }

    fn filter_recent_submissions(env: &Env, submissions: &Vec<PriceData>) -> Vec<PriceData> {
        let mut recent = Vec::new(env);
        let current_time = env.ledger().timestamp();
        
        for submission in submissions.iter() {
            if current_time.saturating_sub(submission.timestamp) <= PRICE_STALENESS_THRESHOLD {
                recent.push_back(submission);
            }
        }
        
        recent
    }

    fn cleanup_old_price_data(env: &Env, submissions: &mut Vec<PriceData>) {
        let current_time = env.ledger().timestamp();
        const CLEANUP_THRESHOLD: u64 = 86400; // 24 hours

        let mut cleaned = Vec::new(env);
        for submission in submissions.iter() {
            if current_time.saturating_sub(submission.timestamp) <= CLEANUP_THRESHOLD {
                cleaned.push_back(submission);
            }
        }

        *submissions = cleaned;
    }

    fn update_price_history(env: &Env, asset_symbol: &Symbol, aggregated_price: &AggregatedPrice) {
        let mut history: Vec<AggregatedPrice> = env
            .storage()
            .instance()
            .get(&DataKey::PriceHistory(asset_symbol.clone()))
            .unwrap_or_else(|| Vec::new(env));

        history.push_back(aggregated_price.clone());

        // Keep only the last MAX_HISTORY_ENTRIES
        if history.len() > MAX_HISTORY_ENTRIES {
            let start_index = history.len() - MAX_HISTORY_ENTRIES;
            let mut trimmed = Vec::new(env);
            for i in start_index..history.len() {
                if let Some(entry) = history.get(i) {
                    trimmed.push_back(entry);
                }
            }
            history = trimmed;
        }

        env.storage().instance().set(&DataKey::PriceHistory(asset_symbol.clone()), &history);
    }

    fn check_admin(env: &Env, caller: &Address) -> Result<(), Symbol> {
        let config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or_else(|| Symbol::new(env, "not_initialized"))?;

        if caller != &config.admin {
            return Err(Symbol::new(env, "unauthorized"));
        }

        Ok(())
    }

    fn check_emergency_stop(env: &Env) -> Result<(), Symbol> {
        let config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or_else(|| Symbol::new(env, "not_initialized"))?;

        if config.emergency_stop {
            return Err(Symbol::new(env, "emergency_stop_active"));
        }

        Ok(())
    }
}