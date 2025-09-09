use soroban_sdk::{Address, Env, Map, Symbol, Vec};
use crate::price_data::{PriceData, PriceUpdateRequest, PRICE_STALENESS_THRESHOLD};
use crate::oracle_node::{OracleNode, RateLimitInfo};

pub struct ValidationEngine;

impl ValidationEngine {
    pub fn validate_price_update(
        env: &Env,
        request: &PriceUpdateRequest,
        oracle_nodes: &Map<Address, OracleNode>,
        rate_limits: &Map<Address, RateLimitInfo>,
        submitter: &Address,
    ) -> Result<(), Symbol> {
        // Check if submitter is a registered oracle node
        let node = oracle_nodes.get(submitter)
            .ok_or_else(|| Symbol::new(env, "unregistered_node"))?;

        // Check if node is eligible
        if !node.is_eligible(env) {
            return Err(Symbol::new(env, "node_not_eligible"));
        }

        // Check rate limiting
        if let Some(rate_limit) = rate_limits.get(submitter) {
            if !node.can_submit(env, &rate_limit) {
                return Err(Symbol::new(env, "rate_limit_exceeded"));
            }
        }

        // Validate price data
        Self::validate_price_data(env, request)?;

        // Validate timestamp
        Self::validate_timestamp(env, request.timestamp)?;

        // Validate signature (simplified - in production, use proper cryptographic validation)
        Self::validate_signature(env, request, submitter)?;

        Ok(())
    }

    fn validate_price_data(env: &Env, request: &PriceUpdateRequest) -> Result<(), Symbol> {
        // Check price is positive
        if request.price == 0 {
            return Err(Symbol::new(env, "invalid_price_zero"));
        }

        // Check for reasonable price bounds (this could be asset-specific)
        const MAX_PRICE: u64 = 1_000_000_0000000; // 1M XLM equivalent
        const MIN_PRICE: u64 = 1; // 1 stroop minimum
        
        if request.price > MAX_PRICE {
            return Err(Symbol::new(env, "price_too_high"));
        }

        if request.price < MIN_PRICE {
            return Err(Symbol::new(env, "price_too_low"));
        }

        // Validate asset symbol is not empty
        if request.asset_symbol.to_string().is_empty() {
            return Err(Symbol::new(env, "invalid_asset_symbol"));
        }

        Ok(())
    }

    fn validate_timestamp(env: &Env, timestamp: u64) -> Result<(), Symbol> {
        let current_time = env.ledger().timestamp();
        
        // Check if timestamp is not too far in the past
        if current_time.saturating_sub(timestamp) > PRICE_STALENESS_THRESHOLD {
            return Err(Symbol::new(env, "timestamp_too_old"));
        }

        // Check if timestamp is not in the future (allow small drift)
        const FUTURE_TOLERANCE: u64 = 60; // 1 minute tolerance
        if timestamp > current_time + FUTURE_TOLERANCE {
            return Err(Symbol::new(env, "timestamp_in_future"));
        }

        Ok(())
    }

    fn validate_signature(
        env: &Env,
        request: &PriceUpdateRequest,
        submitter: &Address,
    ) -> Result<(), Symbol> {
        // Simplified signature validation
        // In a real implementation, you would:
        // 1. Reconstruct the message from request data
        // 2. Verify the signature against the submitter's public key
        // 3. Use proper cryptographic functions
        
        if request.signature.to_string().is_empty() {
            return Err(Symbol::new(env, "missing_signature"));
        }

        // Placeholder validation - replace with actual cryptographic verification
        let expected_signature_length = 64; // Example for ED25519 signatures
        if request.signature.to_string().len() < expected_signature_length {
            return Err(Symbol::new(env, "invalid_signature_format"));
        }

        Ok(())
    }

    pub fn validate_against_historical_data(
        env: &Env,
        new_price: u64,
        asset_symbol: &Symbol,
        price_history: &Map<Symbol, Vec<PriceData>>,
    ) -> Result<u32, Symbol> {
        let history = match price_history.get(asset_symbol) {
            Some(h) => h,
            None => return Ok(50), // Default confidence for new assets
        };

        if history.is_empty() {
            return Ok(50);
        }

        let recent_prices = Self::get_recent_valid_prices(env, &history);
        
        if recent_prices.is_empty() {
            return Ok(50);
        }

        let confidence = Self::calculate_historical_confidence(&recent_prices, new_price);
        Ok(confidence)
    }

    fn get_recent_valid_prices(env: &Env, history: &Vec<PriceData>) -> Vec<u64> {
        let current_time = env.ledger().timestamp();
        let mut recent_prices = Vec::new();

        // Get prices from the last 24 hours
        const RECENT_THRESHOLD: u64 = 86400; // 24 hours

        for price_data in history.iter().rev() {
            if current_time.saturating_sub(price_data.timestamp) <= RECENT_THRESHOLD {
                if price_data.is_valid() {
                    recent_prices.push(price_data.price);
                }
            } else {
                break; // Older prices, stop searching
            }
        }

        recent_prices
    }

    fn calculate_historical_confidence(recent_prices: &Vec<u64>, new_price: u64) -> u32 {
        if recent_prices.is_empty() {
            return 50;
        }

        let avg_price: u64 = recent_prices.iter().sum::<u64>() / recent_prices.len() as u64;
        
        if avg_price == 0 {
            return 0;
        }

        let deviation = if new_price > avg_price {
            new_price - avg_price
        } else {
            avg_price - new_price
        };

        let deviation_percentage = ((deviation * 100) / avg_price) as u32;

        // Higher deviation = lower confidence
        match deviation_percentage {
            0..=1 => 95,
            2..=3 => 90,
            4..=5 => 85,
            6..=8 => 80,
            9..=12 => 75,
            13..=18 => 70,
            19..=25 => 65,
            26..=35 => 60,
            36..=50 => 55,
            _ => 50,
        }
    }

    pub fn detect_anomalous_patterns(
        env: &Env,
        submissions: &Vec<PriceData>,
        submitter: &Address,
    ) -> Vec<Symbol> {
        let mut anomalies = Vec::new(env);

        // Check for rapid consecutive submissions from same node
        let node_submissions: Vec<&PriceData> = submissions
            .iter()
            .filter(|s| &s.oracle_node == submitter)
            .collect();

        if Self::detect_rapid_submissions(env, &node_submissions) {
            anomalies.push_back(Symbol::new(env, "rapid_submissions"));
        }

        // Check for consistently outlier prices
        if Self::detect_consistent_outliers(env, &node_submissions, submissions) {
            anomalies.push_back(Symbol::new(env, "consistent_outliers"));
        }

        // Check for suspicious price patterns
        if Self::detect_suspicious_patterns(env, &node_submissions) {
            anomalies.push_back(Symbol::new(env, "suspicious_patterns"));
        }

        anomalies
    }

    fn detect_rapid_submissions(env: &Env, submissions: &Vec<&PriceData>) -> bool {
        if submissions.len() < 5 {
            return false;
        }

        // Check if more than 5 submissions in last 5 minutes
        let current_time = env.ledger().timestamp();
        const RAPID_THRESHOLD: u64 = 300; // 5 minutes

        let recent_count = submissions
            .iter()
            .filter(|s| current_time.saturating_sub(s.timestamp) <= RAPID_THRESHOLD)
            .count();

        recent_count >= 5
    }

    fn detect_consistent_outliers(
        env: &Env,
        node_submissions: &Vec<&PriceData>,
        all_submissions: &Vec<PriceData>,
    ) -> bool {
        if node_submissions.len() < 3 || all_submissions.len() < 5 {
            return false;
        }

        // Calculate how often this node's prices are outliers
        let mut outlier_count = 0;

        for node_submission in node_submissions.iter() {
            let other_prices: Vec<u64> = all_submissions
                .iter()
                .filter(|s| &s.oracle_node != &node_submission.oracle_node 
                    && s.asset_symbol == node_submission.asset_symbol
                    && (node_submission.timestamp.saturating_sub(s.timestamp) <= 300
                        || s.timestamp.saturating_sub(node_submission.timestamp) <= 300))
                .map(|s| s.price)
                .collect();

            if other_prices.len() < 2 {
                continue;
            }

            let avg_other_price: u64 = other_prices.iter().sum::<u64>() / other_prices.len() as u64;
            
            if avg_other_price > 0 {
                let deviation = if node_submission.price > avg_other_price {
                    node_submission.price - avg_other_price
                } else {
                    avg_other_price - node_submission.price
                };

                let deviation_percentage = ((deviation * 100) / avg_other_price) as u32;
                
                if deviation_percentage > 15 { // More than 15% deviation
                    outlier_count += 1;
                }
            }
        }

        // If more than 60% of submissions are outliers, it's suspicious
        (outlier_count * 100) / node_submissions.len() > 60
    }

    fn detect_suspicious_patterns(env: &Env, submissions: &Vec<&PriceData>) -> bool {
        if submissions.len() < 4 {
            return false;
        }

        // Check for perfectly ascending or descending prices (unnatural)
        let mut prices: Vec<u64> = submissions.iter().map(|s| s.price).collect();
        prices.sort_by(|a, b| {
            submissions.iter()
                .find(|s| s.price == *a)
                .unwrap()
                .timestamp
                .cmp(&submissions.iter()
                    .find(|s| s.price == *b)
                    .unwrap()
                    .timestamp)
        });

        let is_perfectly_ascending = prices.windows(2).all(|w| w[1] > w[0]);
        let is_perfectly_descending = prices.windows(2).all(|w| w[1] < w[0]);

        is_perfectly_ascending || is_perfectly_descending
    }
}