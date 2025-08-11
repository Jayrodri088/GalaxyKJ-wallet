use soroban_sdk::{contracttype, Address, Env, Map, Bytes};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserLimits {
    pub daily_limit: i128,
    pub monthly_limit: i128,
    pub daily_spent: i128,
    pub monthly_spent: i128,
    pub last_daily_reset: u64,
    pub last_monthly_reset: u64,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TransactionAttempt {
    pub user: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub transaction_hash: Bytes,
}

impl Default for UserLimits {
    fn default() -> Self {
        Self {
            daily_limit: 1000_0000000, // 1000 XLM (7 decimal places)
            monthly_limit: 10000_0000000, // 10000 XLM
            daily_spent: 0,
            monthly_spent: 0,
            last_daily_reset: 0,
            last_monthly_reset: 0,
            is_active: true,
        }
    }
}

impl UserLimits {
    pub fn new(daily_limit: i128, monthly_limit: i128, current_time: u64) -> Self {
        Self {
            daily_limit,
            monthly_limit,
            daily_spent: 0,
            monthly_spent: 0,
            last_daily_reset: current_time,
            last_monthly_reset: current_time,
            is_active: true,
        }
    }

    pub fn reset_daily_if_needed(&mut self, current_time: u64) -> bool {
        let one_day = 86400; // seconds in a day
        if current_time >= self.last_daily_reset + one_day {
            self.daily_spent = 0;
            self.last_daily_reset = current_time;
            true
        } else {
            false
        }
    }

    pub fn reset_monthly_if_needed(&mut self, current_time: u64) -> bool {
        let one_month = 2629746; // approximate seconds in a month (30.44 days)
        if current_time >= self.last_monthly_reset + one_month {
            self.monthly_spent = 0;
            self.last_monthly_reset = current_time;
            true
        } else {
            false
        }
    }

    pub fn can_spend(&self, amount: i128) -> bool {
        if !self.is_active {
            return false;
        }
        
        self.daily_spent + amount <= self.daily_limit &&
        self.monthly_spent + amount <= self.monthly_limit
    }

    pub fn add_spending(&mut self, amount: i128) {
        self.daily_spent += amount;
        self.monthly_spent += amount;
    }

    pub fn get_remaining_daily(&self) -> i128 {
        (self.daily_limit - self.daily_spent).max(0)
    }

    pub fn get_remaining_monthly(&self) -> i128 {
        (self.monthly_limit - self.monthly_spent).max(0)
    }
}

pub fn store_user_limits(env: &Env, user: &Address, limits: &UserLimits) {
    let key = (user.clone(),);
    env.storage().persistent().set(&key, limits);
}

pub fn load_user_limits(env: &Env, user: &Address) -> Option<UserLimits> {
    let key = (user.clone(),);
    env.storage().persistent().get(&key)
}

pub fn store_transaction_attempt(env: &Env, attempt: &TransactionAttempt) {
    let key = (attempt.user.clone(), attempt.timestamp);
    env.storage().temporary().set(&key, attempt);
}

pub fn load_user_transactions(env: &Env, user: &Address, from_time: u64, to_time: u64) -> Map<u64, TransactionAttempt> {
    let mut transactions = Map::new(env);
    
    // Limit the range to prevent stack overflow - max 100 seconds range
    let safe_to_time = (from_time + 100).min(to_time);
    
    for timestamp in from_time..=safe_to_time {
        let key = (user.clone(), timestamp);
        if let Some(attempt) = env.storage().temporary().get::<_, TransactionAttempt>(&key) {
            transactions.set(timestamp, attempt);
        }
    }
    
    transactions
}