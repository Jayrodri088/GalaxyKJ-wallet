use soroban_sdk::{contracttype, Address, Env, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceData {
    pub asset_symbol: Symbol,
    pub price: u64,
    pub timestamp: u64,
    pub oracle_node: Address,
    pub confidence: u32, // Confidence level (0-100)
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AggregatedPrice {
    pub asset_symbol: Symbol,
    pub price: u64,
    pub timestamp: u64,
    pub num_sources: u32,
    pub confidence: u32,
    pub deviation: u32, // Price deviation as percentage
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceUpdateRequest {
    pub asset_symbol: Symbol,
    pub price: u64,
    pub timestamp: u64,
    pub signature: Symbol, // Simplified signature representation
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceHistory {
    pub asset_symbol: Symbol,
    pub prices: soroban_sdk::Vec<u64>,
    pub timestamps: soroban_sdk::Vec<u64>,
    pub max_entries: u32,
}

pub const PRICE_STALENESS_THRESHOLD: u64 = 300; // 5 minutes in seconds
pub const MAX_PRICE_DEVIATION: u32 = 10; // 10% maximum deviation
pub const MIN_CONFIDENCE_LEVEL: u32 = 70; // Minimum 70% confidence
pub const MAX_HISTORY_ENTRIES: u32 = 100;

impl PriceData {
    pub fn new(
        env: &Env,
        asset_symbol: Symbol,
        price: u64,
        oracle_node: Address,
        confidence: u32,
    ) -> Self {
        Self {
            asset_symbol,
            price,
            timestamp: env.ledger().timestamp(),
            oracle_node,
            confidence,
        }
    }

    pub fn is_stale(&self, env: &Env) -> bool {
        let current_time = env.ledger().timestamp();
        current_time.saturating_sub(self.timestamp) > PRICE_STALENESS_THRESHOLD
    }

    pub fn is_valid(&self) -> bool {
        self.price > 0 && self.confidence >= MIN_CONFIDENCE_LEVEL
    }
}

impl AggregatedPrice {
    pub fn new(
        env: &Env,
        asset_symbol: Symbol,
        price: u64,
        num_sources: u32,
        confidence: u32,
        deviation: u32,
    ) -> Self {
        Self {
            asset_symbol,
            price,
            timestamp: env.ledger().timestamp(),
            num_sources,
            confidence,
            deviation,
        }
    }

    pub fn is_reliable(&self) -> bool {
        self.num_sources >= 3 
            && self.confidence >= MIN_CONFIDENCE_LEVEL 
            && self.deviation <= MAX_PRICE_DEVIATION
    }
}