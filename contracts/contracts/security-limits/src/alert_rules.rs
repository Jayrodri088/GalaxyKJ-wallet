use soroban_sdk::{contracttype, Address, Env, String, Vec, Bytes};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AlertType {
    DailyLimitExceeded,
    MonthlyLimitExceeded,
    SuspiciousActivity,
    UnknownAddress,
    VelocityAnomaly,
    LargeTransaction,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AlertRule {
    pub rule_id: u64,
    pub alert_type: AlertType,
    pub is_enabled: bool,
    pub threshold_amount: Option<i128>,
    pub time_window_seconds: Option<u64>,
    pub max_transactions: Option<u32>,
    pub description: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Alert {
    pub alert_id: u64,
    pub user: Address,
    pub alert_type: AlertType,
    pub triggered_at: u64,
    pub amount: i128,
    pub transaction_hash: Option<Bytes>,
    pub message: String,
    pub is_resolved: bool,
}

impl AlertRule {
    pub fn new_daily_limit_rule(rule_id: u64) -> Self {
        Self {
            rule_id,
            alert_type: AlertType::DailyLimitExceeded,
            is_enabled: true,
            threshold_amount: None,
            time_window_seconds: Some(86400), // 24 hours
            max_transactions: None,
            description: String::from_str(&soroban_sdk::Env::default(), "Daily spending limit exceeded"),
        }
    }

    pub fn new_monthly_limit_rule(rule_id: u64) -> Self {
        Self {
            rule_id,
            alert_type: AlertType::MonthlyLimitExceeded,
            is_enabled: true,
            threshold_amount: None,
            time_window_seconds: Some(2629746), // ~30 days
            max_transactions: None,
            description: String::from_str(&soroban_sdk::Env::default(), "Monthly spending limit exceeded"),
        }
    }

    pub fn new_large_transaction_rule(rule_id: u64, threshold: i128) -> Self {
        Self {
            rule_id,
            alert_type: AlertType::LargeTransaction,
            is_enabled: true,
            threshold_amount: Some(threshold),
            time_window_seconds: None,
            max_transactions: None,
            description: String::from_str(&soroban_sdk::Env::default(), "Large transaction detected"),
        }
    }

    pub fn new_velocity_rule(rule_id: u64, max_transactions: u32, time_window: u64) -> Self {
        Self {
            rule_id,
            alert_type: AlertType::VelocityAnomaly,
            is_enabled: true,
            threshold_amount: None,
            time_window_seconds: Some(time_window),
            max_transactions: Some(max_transactions),
            description: String::from_str(&soroban_sdk::Env::default(), "High transaction velocity detected"),
        }
    }

    pub fn new_unknown_address_rule(rule_id: u64) -> Self {
        Self {
            rule_id,
            alert_type: AlertType::UnknownAddress,
            is_enabled: true,
            threshold_amount: None,
            time_window_seconds: None,
            max_transactions: None,
            description: String::from_str(&soroban_sdk::Env::default(), "Transaction to unknown address"),
        }
    }
}

impl Alert {
    pub fn new(
        alert_id: u64,
        user: Address,
        alert_type: AlertType,
        triggered_at: u64,
        amount: i128,
        transaction_hash: Option<Bytes>,
        message: String,
    ) -> Self {
        Self {
            alert_id,
            user,
            alert_type,
            triggered_at,
            amount,
            transaction_hash,
            message,
            is_resolved: false,
        }
    }

    pub fn resolve(&mut self) {
        self.is_resolved = true;
    }
}

pub fn store_alert_rule(env: &Env, rule: &AlertRule) {
    let key = rule.rule_id;
    env.storage().persistent().set(&key, rule);
}

pub fn load_alert_rule(env: &Env, rule_id: u64) -> Option<AlertRule> {
    env.storage().persistent().get(&rule_id)
}

pub fn get_all_alert_rules(env: &Env) -> Vec<AlertRule> {
    let mut rules = Vec::new(env);
    
    // Reduced range to prevent stack overflow - only check first 20 rules
    for rule_id in 1..=20u64 {
        if let Some(rule) = load_alert_rule(env, rule_id) {
            if rule.is_enabled {
                rules.push_back(rule);
            }
        }
    }
    
    rules
}

pub fn store_alert(env: &Env, alert: &Alert) {
    let key = (alert.user.clone(), alert.alert_id);
    env.storage().persistent().set(&key, alert);
}

pub fn load_alert(env: &Env, user: &Address, alert_id: u64) -> Option<Alert> {
    let key = (user.clone(), alert_id);
    env.storage().persistent().get(&key)
}

pub fn get_user_alerts(env: &Env, user: &Address, limit: u32) -> Vec<Alert> {
    let mut alerts = Vec::new(env);
    let mut count = 0u32;
    
    // Reduced range to prevent stack overflow - only check recent alerts
    for alert_id in 1..=50u64 {
        if count >= limit {
            break;
        }
        
        if let Some(alert) = load_alert(env, user, alert_id) {
            alerts.push_back(alert);
            count += 1;
        }
    }
    
    alerts
}

pub fn get_unresolved_alerts(env: &Env, user: &Address) -> Vec<Alert> {
    let mut unresolved = Vec::new(env);
    
    // Reduced range to prevent stack overflow - only check recent alerts
    for alert_id in 1..=50u64 {
        if let Some(alert) = load_alert(env, user, alert_id) {
            if !alert.is_resolved {
                unresolved.push_back(alert);
            }
        }
    }
    
    unresolved
}

pub fn generate_alert_id(env: &Env) -> u64 {
    let key = String::from_str(env, "alert_counter");
    let current: u64 = env.storage().persistent().get(&key).unwrap_or(0);
    let new_id = current + 1;
    env.storage().persistent().set(&key, &new_id);
    new_id
}