use soroban_sdk::{Address, Env, Map, Symbol, Vec};
use crate::price_data::{PriceData, AggregatedPrice, MAX_PRICE_DEVIATION};
use crate::oracle_node::OracleNode;

pub struct PriceAggregator;

impl PriceAggregator {
    pub fn aggregate_prices(
        env: &Env,
        asset_symbol: Symbol,
        price_submissions: &Vec<PriceData>,
        oracle_nodes: &Map<Address, OracleNode>,
    ) -> Result<AggregatedPrice, Symbol> {
        if price_submissions.is_empty() {
            return Err(Symbol::new(env, "no_price_data"));
        }

        let valid_submissions = Self::filter_valid_submissions(env, price_submissions, oracle_nodes);
        
        if valid_submissions.is_empty() {
            return Err(Symbol::new(env, "no_valid_submissions"));
        }

        let aggregated_price = Self::calculate_weighted_median(env, &valid_submissions, oracle_nodes)?;
        let confidence = Self::calculate_confidence(env, &valid_submissions, oracle_nodes);
        let deviation = Self::calculate_price_deviation(&valid_submissions);

        let result = AggregatedPrice::new(
            env,
            asset_symbol,
            aggregated_price,
            valid_submissions.len(),
            confidence,
            deviation,
        );

        if result.is_reliable() {
            Ok(result)
        } else {
            Err(Symbol::new(env, "unreliable_price"))
        }
    }

    fn filter_valid_submissions(
        env: &Env,
        submissions: &Vec<PriceData>,
        oracle_nodes: &Map<Address, OracleNode>,
    ) -> Vec<PriceData> {
        let mut valid_submissions = Vec::new(env);

        for submission in submissions.iter() {
            if !submission.is_valid() || submission.is_stale(env) {
                continue;
            }

            if let Some(node) = oracle_nodes.get(&submission.oracle_node) {
                if node.is_eligible(env) {
                    valid_submissions.push_back(submission);
                }
            }
        }

        // Remove outliers
        Self::remove_outliers(env, valid_submissions)
    }

    fn remove_outliers(env: &Env, submissions: Vec<PriceData>) -> Vec<PriceData> {
        if submissions.len() < 3 {
            return submissions;
        }

        // Calculate median for outlier detection
        let mut prices: Vec<u64> = submissions.iter().map(|s| s.price).collect();
        prices.sort();
        
        let median = if prices.len() % 2 == 0 {
            let mid = prices.len() / 2;
            (prices.get(mid - 1).unwrap_or(&0) + prices.get(mid).unwrap_or(&0)) / 2
        } else {
            *prices.get(prices.len() / 2).unwrap_or(&0)
        };

        let max_deviation = (median * MAX_PRICE_DEVIATION as u64) / 100;
        let mut filtered = Vec::new(env);

        for submission in submissions.iter() {
            let deviation = if submission.price > median {
                submission.price - median
            } else {
                median - submission.price
            };

            if deviation <= max_deviation {
                filtered.push_back(submission);
            }
        }

        filtered
    }

    fn calculate_weighted_median(
        env: &Env,
        submissions: &Vec<PriceData>,
        oracle_nodes: &Map<Address, OracleNode>,
    ) -> Result<u64, Symbol> {
        if submissions.is_empty() {
            return Err(Symbol::new(env, "no_submissions"));
        }

        // Create weighted price entries
        let mut weighted_prices = Vec::new(env);
        let mut total_weight = 0u64;

        for submission in submissions.iter() {
            if let Some(node) = oracle_nodes.get(&submission.oracle_node) {
                let weight = Self::calculate_node_weight(&node, &submission);
                total_weight += weight;
                
                for _ in 0..weight {
                    weighted_prices.push_back(submission.price);
                }
            }
        }

        if weighted_prices.is_empty() {
            return Err(Symbol::new(env, "no_weighted_data"));
        }

        // Sort and find median
        let mut sorted_prices: Vec<u64> = weighted_prices.iter().collect();
        sorted_prices.sort();

        let median = if sorted_prices.len() % 2 == 0 {
            let mid = sorted_prices.len() / 2;
            (sorted_prices.get(mid - 1).unwrap_or(&0) + sorted_prices.get(mid).unwrap_or(&0)) / 2
        } else {
            *sorted_prices.get(sorted_prices.len() / 2).unwrap_or(&0)
        };

        Ok(median)
    }

    fn calculate_node_weight(node: &OracleNode, submission: &PriceData) -> u64 {
        let base_weight = 1u64;
        let reputation_multiplier = (node.reputation_score as u64).max(1) / 10; // 1-10x
        let confidence_multiplier = (submission.confidence as u64).max(1) / 20; // 1-5x
        let stake_multiplier = (node.stake_amount / 1000_0000000).max(1).min(5); // 1-5x based on stake

        base_weight * reputation_multiplier * confidence_multiplier * stake_multiplier
    }

    fn calculate_confidence(
        env: &Env,
        submissions: &Vec<PriceData>,
        oracle_nodes: &Map<Address, OracleNode>,
    ) -> u32 {
        if submissions.is_empty() {
            return 0;
        }

        let mut total_confidence = 0u64;
        let mut total_weight = 0u64;

        for submission in submissions.iter() {
            if let Some(node) = oracle_nodes.get(&submission.oracle_node) {
                let weight = Self::calculate_node_weight(&node, &submission);
                total_confidence += (submission.confidence as u64) * weight;
                total_weight += weight;
            }
        }

        if total_weight == 0 {
            return 0;
        }

        let weighted_confidence = total_confidence / total_weight;
        
        // Apply bonus for number of sources
        let source_bonus = match submissions.len() {
            1 => 0,
            2 => 5,
            3..=5 => 10,
            _ => 15,
        };

        (weighted_confidence as u32 + source_bonus).min(100)
    }

    fn calculate_price_deviation(submissions: &Vec<PriceData>) -> u32 {
        if submissions.len() < 2 {
            return 0;
        }

        let prices: Vec<u64> = submissions.iter().map(|s| s.price).collect();
        let avg_price: u64 = prices.iter().sum::<u64>() / prices.len() as u64;

        if avg_price == 0 {
            return 100; // Maximum deviation
        }

        let mut max_deviation = 0u32;
        
        for price in prices.iter() {
            let deviation = if *price > avg_price {
                *price - avg_price
            } else {
                avg_price - *price
            };
            
            let deviation_percentage = ((deviation * 100) / avg_price) as u32;
            max_deviation = max_deviation.max(deviation_percentage);
        }

        max_deviation.min(100)
    }

    pub fn get_fallback_price(
        env: &Env,
        asset_symbol: Symbol,
        price_history: &Map<Symbol, Vec<AggregatedPrice>>,
    ) -> Result<u64, Symbol> {
        if let Some(history) = price_history.get(&asset_symbol) {
            if !history.is_empty() {
                // Return the most recent reliable price
                for price_entry in history.iter().rev() {
                    if price_entry.is_reliable() && !Self::is_price_stale(env, &price_entry) {
                        return Ok(price_entry.price);
                    }
                }
            }
        }
        
        Err(Symbol::new(env, "no_fallback_available"))
    }

    fn is_price_stale(env: &Env, price: &AggregatedPrice) -> bool {
        let current_time = env.ledger().timestamp();
        let staleness_threshold = 1800; // 30 minutes for fallback prices
        current_time.saturating_sub(price.timestamp) > staleness_threshold
    }

    pub fn update_oracle_accuracy(
        oracle_nodes: &mut Map<Address, OracleNode>,
        submission: &PriceData,
        aggregated_price: u64,
    ) {
        if let Some(mut node) = oracle_nodes.get(&submission.oracle_node) {
            let price_diff = if submission.price > aggregated_price {
                submission.price - aggregated_price
            } else {
                aggregated_price - submission.price
            };

            let deviation_percentage = if aggregated_price > 0 {
                ((price_diff * 100) / aggregated_price) as u32
            } else {
                100
            };

            let was_accurate = deviation_percentage <= 5; // Within 5% is considered accurate
            node.update_reputation(was_accurate);
            
            oracle_nodes.set(submission.oracle_node.clone(), node);
        }
    }
}