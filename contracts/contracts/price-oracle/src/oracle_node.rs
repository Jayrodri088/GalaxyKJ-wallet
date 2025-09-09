use soroban_sdk::{contracttype, Address, Env, Map, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OracleNode {
    pub address: Address,
    pub reputation_score: u32,
    pub total_submissions: u32,
    pub accurate_submissions: u32,
    pub last_submission_time: u64,
    pub is_active: bool,
    pub stake_amount: u64,
    pub registered_time: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NodeRegistration {
    pub node_address: Address,
    pub stake_amount: u64,
    pub metadata: Symbol, // JSON-like metadata as Symbol
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RateLimitInfo {
    pub node_address: Address,
    pub submission_count: u32,
    pub window_start: u64,
    pub last_submission: u64,
}

pub const MIN_STAKE_AMOUNT: u64 = 1000_0000000; // 1000 XLM in stroops
pub const MIN_REPUTATION_SCORE: u32 = 70;
pub const MAX_SUBMISSIONS_PER_HOUR: u32 = 60;
pub const RATE_LIMIT_WINDOW: u64 = 3600; // 1 hour in seconds
pub const REPUTATION_DECAY_TIME: u64 = 86400 * 7; // 7 days
pub const MIN_SUBMISSIONS_FOR_REPUTATION: u32 = 10;

impl OracleNode {
    pub fn new(env: &Env, address: Address, stake_amount: u64) -> Self {
        Self {
            address,
            reputation_score: 100, // Start with perfect reputation
            total_submissions: 0,
            accurate_submissions: 0,
            last_submission_time: 0,
            is_active: true,
            stake_amount,
            registered_time: env.ledger().timestamp(),
        }
    }

    pub fn calculate_reputation(&self) -> u32 {
        if self.total_submissions < MIN_SUBMISSIONS_FOR_REPUTATION {
            return 100; // New nodes start with perfect reputation
        }

        let accuracy_percentage = (self.accurate_submissions * 100) / self.total_submissions;
        accuracy_percentage.min(100)
    }

    pub fn update_reputation(&mut self, was_accurate: bool) {
        self.total_submissions += 1;
        if was_accurate {
            self.accurate_submissions += 1;
        }
        self.reputation_score = self.calculate_reputation();
    }

    pub fn is_eligible(&self, env: &Env) -> bool {
        self.is_active
            && self.stake_amount >= MIN_STAKE_AMOUNT
            && self.reputation_score >= MIN_REPUTATION_SCORE
            && !self.is_reputation_stale(env)
    }

    pub fn is_reputation_stale(&self, env: &Env) -> bool {
        let current_time = env.ledger().timestamp();
        current_time.saturating_sub(self.last_submission_time) > REPUTATION_DECAY_TIME
    }

    pub fn can_submit(&self, env: &Env, rate_limit: &RateLimitInfo) -> bool {
        let current_time = env.ledger().timestamp();
        
        // Reset rate limit window if needed
        if current_time.saturating_sub(rate_limit.window_start) >= RATE_LIMIT_WINDOW {
            return true;
        }

        rate_limit.submission_count < MAX_SUBMISSIONS_PER_HOUR
    }

    pub fn slash_stake(&mut self, slash_amount: u64) {
        self.stake_amount = self.stake_amount.saturating_sub(slash_amount);
        if self.stake_amount < MIN_STAKE_AMOUNT {
            self.is_active = false;
        }
    }
}

impl RateLimitInfo {
    pub fn new(env: &Env, node_address: Address) -> Self {
        let current_time = env.ledger().timestamp();
        Self {
            node_address,
            submission_count: 0,
            window_start: current_time,
            last_submission: 0,
        }
    }

    pub fn record_submission(&mut self, env: &Env) -> bool {
        let current_time = env.ledger().timestamp();

        // Reset window if needed
        if current_time.saturating_sub(self.window_start) >= RATE_LIMIT_WINDOW {
            self.window_start = current_time;
            self.submission_count = 0;
        }

        if self.submission_count >= MAX_SUBMISSIONS_PER_HOUR {
            return false; // Rate limit exceeded
        }

        self.submission_count += 1;
        self.last_submission = current_time;
        true
    }
}

pub struct NodeManager;

impl NodeManager {
    pub fn register_node(
        env: &Env,
        nodes: &mut Map<Address, OracleNode>,
        rate_limits: &mut Map<Address, RateLimitInfo>,
        registration: NodeRegistration,
    ) -> Result<(), Symbol> {
        if nodes.contains_key(&registration.node_address) {
            return Err(Symbol::new(env, "node_already_registered"));
        }

        if registration.stake_amount < MIN_STAKE_AMOUNT {
            return Err(Symbol::new(env, "insufficient_stake"));
        }

        let node = OracleNode::new(env, registration.node_address.clone(), registration.stake_amount);
        let rate_limit = RateLimitInfo::new(env, registration.node_address.clone());

        nodes.set(registration.node_address.clone(), node);
        rate_limits.set(registration.node_address, rate_limit);

        Ok(())
    }

    pub fn deactivate_node(
        nodes: &mut Map<Address, OracleNode>,
        node_address: &Address,
    ) -> Result<(), Symbol> {
        if let Some(mut node) = nodes.get(node_address) {
            node.is_active = false;
            nodes.set(node_address.clone(), node);
            Ok(())
        } else {
            Err(Symbol::new(&nodes.env(), "node_not_found"))
        }
    }

    pub fn get_eligible_nodes(
        env: &Env,
        nodes: &Map<Address, OracleNode>,
    ) -> Vec<Address> {
        let mut eligible_nodes = Vec::new(env);
        
        for (address, node) in nodes.iter() {
            if node.is_eligible(env) {
                eligible_nodes.push_back(address);
            }
        }

        eligible_nodes
    }
}