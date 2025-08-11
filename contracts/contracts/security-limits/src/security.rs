use soroban_sdk::{contracttype, Address, Env, String, Vec};
use crate::alert_rules::{Alert, AlertType, generate_alert_id};
use crate::user_limits::TransactionAttempt;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SecurityStatus {
    Normal,
    Suspicious,
    Blocked,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AddressList {
    pub addresses: Vec<Address>,
    pub list_type: ListType,
    pub last_updated: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ListType {
    Whitelist,
    Blacklist,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SecurityMetrics {
    pub user: Address,
    pub transaction_count_24h: u32,
    pub total_amount_24h: i128,
    pub unique_recipients_24h: u32,
    pub avg_transaction_amount: i128,
    pub last_transaction_time: u64,
    pub risk_score: u32, // 0-100, higher is riskier
}

impl SecurityMetrics {
    pub fn new(user: Address, current_time: u64) -> Self {
        Self {
            user,
            transaction_count_24h: 0,
            total_amount_24h: 0,
            unique_recipients_24h: 0,
            avg_transaction_amount: 0,
            last_transaction_time: current_time,
            risk_score: 0,
        }
    }

    pub fn update_with_transaction(&mut self, amount: i128, recipient: &Address, current_time: u64) {
        self.transaction_count_24h += 1;
        self.total_amount_24h += amount;
        self.last_transaction_time = current_time;
        
        if self.transaction_count_24h > 0 {
            self.avg_transaction_amount = self.total_amount_24h / (self.transaction_count_24h as i128);
        }
        
        self.calculate_risk_score(current_time);
    }

    pub fn calculate_risk_score(&mut self, current_time: u64) {
        let mut score = 0u32;
        
        // High transaction count increases risk
        if self.transaction_count_24h > 50 {
            score += 30;
        } else if self.transaction_count_24h > 20 {
            score += 15;
        }
        
        // Large amounts increase risk
        if self.total_amount_24h > 100000_0000000 { // > 100k XLM
            score += 25;
        } else if self.total_amount_24h > 10000_0000000 { // > 10k XLM
            score += 10;
        }
        
        // Many unique recipients increase risk
        if self.unique_recipients_24h > 20 {
            score += 20;
        } else if self.unique_recipients_24h > 10 {
            score += 10;
        }
        
        // Rapid transactions increase risk
        let time_since_last = current_time - self.last_transaction_time;
        if time_since_last < 60 { // less than 1 minute
            score += 15;
        }
        
        self.risk_score = score.min(100);
    }

    pub fn reset_daily_metrics(&mut self, current_time: u64) {
        self.transaction_count_24h = 0;
        self.total_amount_24h = 0;
        self.unique_recipients_24h = 0;
        self.avg_transaction_amount = 0;
        self.risk_score = 0;
        self.last_transaction_time = current_time;
    }
}

pub fn is_address_whitelisted(env: &Env, address: &Address) -> bool {
    let key = (String::from_str(env, "whitelist"), address.clone());
    env.storage().persistent().has(&key)
}

pub fn is_address_blacklisted(env: &Env, address: &Address) -> bool {
    let key = (String::from_str(env, "blacklist"), address.clone());
    env.storage().persistent().has(&key)
}

pub fn add_to_whitelist(env: &Env, address: &Address) {
    let key = (String::from_str(env, "whitelist"), address.clone());
    let current_time = env.ledger().timestamp();
    env.storage().persistent().set(&key, &current_time);
}

pub fn add_to_blacklist(env: &Env, address: &Address) {
    let key = (String::from_str(env, "blacklist"), address.clone());
    let current_time = env.ledger().timestamp();
    env.storage().persistent().set(&key, &current_time);
}

pub fn remove_from_whitelist(env: &Env, address: &Address) {
    let key = (String::from_str(env, "whitelist"), address.clone());
    env.storage().persistent().remove(&key);
}

pub fn remove_from_blacklist(env: &Env, address: &Address) {
    let key = (String::from_str(env, "blacklist"), address.clone());
    env.storage().persistent().remove(&key);
}

pub fn detect_suspicious_activity(
    env: &Env, 
    user: &Address, 
    recipient: &Address, 
    amount: i128,
    current_time: u64
) -> Vec<Alert> {
    let mut alerts = Vec::new(env);
    
    // Check if recipient is blacklisted
    if is_address_blacklisted(env, recipient) {
        let alert_id = generate_alert_id(env);
        let alert = Alert::new(
            alert_id,
            user.clone(),
            AlertType::UnknownAddress,
            current_time,
            amount,
            None,
            String::from_str(env, "Transaction to blacklisted address"),
        );
        alerts.push_back(alert);
    }
    
    // Get user security metrics
    let metrics_key = user.clone();
    let mut metrics: SecurityMetrics = env.storage()
        .persistent()
        .get(&metrics_key)
        .unwrap_or_else(|| SecurityMetrics::new(user.clone(), current_time));
    
    // Update metrics with current transaction
    metrics.update_with_transaction(amount, recipient, current_time);
    
    // Check for velocity anomalies
    if metrics.transaction_count_24h > 100 {
        let alert_id = generate_alert_id(env);
        let alert = Alert::new(
            alert_id,
            user.clone(),
            AlertType::VelocityAnomaly,
            current_time,
            amount,
            None,
            String::from_str(env, "Unusually high transaction velocity"),
        );
        alerts.push_back(alert);
    }
    
    // Check for large transactions
    if amount > 50000_0000000 { // > 50k XLM
        let alert_id = generate_alert_id(env);
        let alert = Alert::new(
            alert_id,
            user.clone(),
            AlertType::LargeTransaction,
            current_time,
            amount,
            None,
            String::from_str(env, "Large transaction amount detected"),
        );
        alerts.push_back(alert);
    }
    
    // Check high risk score
    if metrics.risk_score > 70 {
        let alert_id = generate_alert_id(env);
        let alert = Alert::new(
            alert_id,
            user.clone(),
            AlertType::SuspiciousActivity,
            current_time,
            amount,
            None,
            String::from_str(env, "High risk score detected"),
        );
        alerts.push_back(alert);
    }
    
    // Store updated metrics
    env.storage().persistent().set(&metrics_key, &metrics);
    
    alerts
}

pub fn get_security_status(env: &Env, user: &Address) -> SecurityStatus {
    let metrics_key = user.clone();
    let metrics: Option<SecurityMetrics> = env.storage().persistent().get(&metrics_key);
    
    match metrics {
        Some(m) if m.risk_score > 80 => SecurityStatus::Blocked,
        Some(m) if m.risk_score > 50 => SecurityStatus::Suspicious,
        _ => SecurityStatus::Normal,
    }
}

pub fn store_security_metrics(env: &Env, metrics: &SecurityMetrics) {
    let key = metrics.user.clone();
    env.storage().persistent().set(&key, metrics);
}

pub fn load_security_metrics(env: &Env, user: &Address) -> Option<SecurityMetrics> {
    let key = user.clone();
    env.storage().persistent().get(&key)
}

pub fn reset_user_risk_score(env: &Env, user: &Address) {
    let key = user.clone();
    if let Some(mut metrics) = env.storage().persistent().get::<_, SecurityMetrics>(&key) {
        metrics.risk_score = 0;
        env.storage().persistent().set(&key, &metrics);
    }
}

pub fn is_emergency_stop_active(env: &Env) -> bool {
    let key = String::from_str(env, "emergency_stop");
    env.storage().persistent().get(&key).unwrap_or(false)
}

pub fn activate_emergency_stop(env: &Env) {
    let key = String::from_str(env, "emergency_stop");
    env.storage().persistent().set(&key, &true);
}

pub fn deactivate_emergency_stop(env: &Env) {
    let key = String::from_str(env, "emergency_stop");
    env.storage().persistent().set(&key, &false);
}