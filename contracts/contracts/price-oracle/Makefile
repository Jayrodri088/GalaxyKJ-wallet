# Galaxy Smart Wallet - Price Oracle Contract Makefile

# Default target
.PHONY: help
help: ## Show this help message
	@echo "Galaxy Smart Wallet - Price Oracle Contract"
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

# Build targets
.PHONY: build
build: ## Build the price oracle contract
	@echo "Building price oracle contract..."
	cargo build --target wasm32-unknown-unknown --release

.PHONY: build-dev
build-dev: ## Build the contract in development mode
	@echo "Building price oracle contract (development mode)..."
	cargo build

.PHONY: clean
clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	cargo clean

# Test targets
.PHONY: test
test: ## Run all unit tests
	@echo "Running unit tests..."
	cargo test

.PHONY: test-verbose
test-verbose: ## Run tests with verbose output
	@echo "Running unit tests (verbose)..."
	cargo test -- --nocapture

.PHONY: test-coverage
test-coverage: ## Run tests with coverage (requires cargo-tarpaulin)
	@echo "Running tests with coverage..."
	cargo tarpaulin --out Html --output-dir coverage

# Linting and formatting
.PHONY: lint
lint: ## Run clippy linter
	@echo "Running clippy linter..."
	cargo clippy -- -D warnings

.PHONY: format
format: ## Format code with rustfmt
	@echo "Formatting code..."
	cargo fmt

.PHONY: format-check
format-check: ## Check code formatting
	@echo "Checking code formatting..."
	cargo fmt -- --check

# Contract deployment and interaction (requires Soroban CLI)
.PHONY: deploy-testnet
deploy-testnet: build ## Deploy contract to Stellar testnet
	@echo "Deploying to Stellar testnet..."
	soroban contract deploy \
		--wasm target/wasm32-unknown-unknown/release/price_oracle.wasm \
		--source-account admin \
		--network testnet

.PHONY: deploy-futurenet
deploy-futurenet: build ## Deploy contract to Stellar futurenet
	@echo "Deploying to Stellar futurenet..."
	soroban contract deploy \
		--wasm target/wasm32-unknown-unknown/release/price_oracle.wasm \
		--source-account admin \
		--network futurenet

.PHONY: deploy-local
deploy-local: build ## Deploy contract to local Stellar network
	@echo "Deploying to local network..."
	soroban contract deploy \
		--wasm target/wasm32-unknown-unknown/release/price_oracle.wasm \
		--source-account admin \
		--network local

# Contract interaction examples
.PHONY: init-contract
init-contract: ## Initialize the deployed contract (requires CONTRACT_ID)
	@if [ -z "$(CONTRACT_ID)" ]; then \
		echo "Error: CONTRACT_ID environment variable is required"; \
		echo "Usage: make init-contract CONTRACT_ID=<contract_id>"; \
		exit 1; \
	fi
	@echo "Initializing contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account admin \
		--network testnet \
		-- \
		initialize \
		--admin $(shell soroban config identity address admin)

.PHONY: register-oracle
register-oracle: ## Register an oracle node (requires CONTRACT_ID and ORACLE_ADDRESS)
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(ORACLE_ADDRESS)" ]; then \
		echo "Error: CONTRACT_ID and ORACLE_ADDRESS environment variables are required"; \
		echo "Usage: make register-oracle CONTRACT_ID=<contract_id> ORACLE_ADDRESS=<oracle_address>"; \
		exit 1; \
	fi
	@echo "Registering oracle $(ORACLE_ADDRESS) on contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account admin \
		--network testnet \
		-- \
		register_oracle_node \
		--caller $(shell soroban config identity address admin) \
		--registration '{"node_address":"$(ORACLE_ADDRESS)","stake_amount":"2000000000000","metadata":"test_oracle"}'

.PHONY: submit-price
submit-price: ## Submit a price update (requires CONTRACT_ID, ASSET, and PRICE)
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(ASSET)" ] || [ -z "$(PRICE)" ]; then \
		echo "Error: CONTRACT_ID, ASSET, and PRICE environment variables are required"; \
		echo "Usage: make submit-price CONTRACT_ID=<contract_id> ASSET=<asset_symbol> PRICE=<price>"; \
		exit 1; \
	fi
	@echo "Submitting price for $(ASSET): $(PRICE) on contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account oracle \
		--network testnet \
		-- \
		submit_price \
		--caller $(shell soroban config identity address oracle) \
		--price_update '{"asset_symbol":"$(ASSET)","price":"$(PRICE)","timestamp":'$(shell date +%s)',"signature":"test_signature_placeholder"}'

.PHONY: get-price
get-price: ## Get current price for an asset (requires CONTRACT_ID and ASSET)
	@if [ -z "$(CONTRACT_ID)" ] || [ -z "$(ASSET)" ]; then \
		echo "Error: CONTRACT_ID and ASSET environment variables are required"; \
		echo "Usage: make get-price CONTRACT_ID=<contract_id> ASSET=<asset_symbol>"; \
		exit 1; \
	fi
	@echo "Getting price for $(ASSET) from contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account reader \
		--network testnet \
		-- \
		get_price \
		--asset_symbol $(ASSET)

# Development targets
.PHONY: watch
watch: ## Watch for changes and rebuild
	@echo "Watching for changes..."
	cargo watch -x build

.PHONY: watch-test
watch-test: ## Watch for changes and run tests
	@echo "Watching for changes and running tests..."
	cargo watch -x test

# Quality assurance
.PHONY: check-all
check-all: format-check lint test ## Run all quality checks
	@echo "All quality checks completed successfully!"

.PHONY: fix-all
fix-all: format lint ## Fix formatting and linting issues
	@echo "Fixed all auto-fixable issues!"

# Documentation
.PHONY: docs
docs: ## Generate and open documentation
	@echo "Generating documentation..."
	cargo doc --open

.PHONY: docs-deps
docs-deps: ## Generate documentation including dependencies
	@echo "Generating documentation with dependencies..."
	cargo doc --document-private-items --open

# Contract optimization
.PHONY: optimize
optimize: ## Build optimized wasm for production
	@echo "Building optimized wasm..."
	cargo build --target wasm32-unknown-unknown --release
	@echo "Optimizing wasm size..."
	wasm-opt -Oz --output target/wasm32-unknown-unknown/release/price_oracle_optimized.wasm \
		target/wasm32-unknown-unknown/release/price_oracle.wasm

# Setup targets
.PHONY: setup-dev
setup-dev: ## Set up development environment
	@echo "Setting up development environment..."
	rustup target add wasm32-unknown-unknown
	cargo install cargo-watch
	cargo install soroban-cli
	@echo "Development environment setup complete!"

.PHONY: setup-tools
setup-tools: ## Install additional development tools
	@echo "Installing additional development tools..."
	cargo install cargo-tarpaulin
	cargo install wasm-opt
	@echo "Additional tools installed!"

# Validation targets
.PHONY: validate-wasm
validate-wasm: build ## Validate the generated WASM
	@echo "Validating WASM..."
	soroban contract install \
		--wasm target/wasm32-unknown-unknown/release/price_oracle.wasm \
		--network testnet

.PHONY: inspect-wasm
inspect-wasm: build ## Inspect WASM file information
	@echo "Inspecting WASM file..."
	wasm-objdump -h target/wasm32-unknown-unknown/release/price_oracle.wasm
	@echo "WASM file size:"
	ls -lh target/wasm32-unknown-unknown/release/price_oracle.wasm

# Full workflow targets
.PHONY: ci
ci: check-all build ## Run continuous integration workflow
	@echo "CI workflow completed successfully!"

.PHONY: release
release: clean optimize validate-wasm ## Prepare for release
	@echo "Release preparation completed!"

# Configuration management
.PHONY: show-config
show-config: ## Show current Soroban configuration
	@echo "Soroban networks:"
	@soroban config network ls
	@echo "Soroban identities:"
	@soroban config identity ls

# Emergency targets
.PHONY: emergency-stop
emergency-stop: ## Enable emergency stop (requires CONTRACT_ID)
	@if [ -z "$(CONTRACT_ID)" ]; then \
		echo "Error: CONTRACT_ID environment variable is required"; \
		echo "Usage: make emergency-stop CONTRACT_ID=<contract_id>"; \
		exit 1; \
	fi
	@echo "Enabling emergency stop on contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account admin \
		--network testnet \
		-- \
		set_emergency_stop \
		--caller $(shell soroban config identity address admin) \
		--emergency_stop true

.PHONY: resume-operations
resume-operations: ## Disable emergency stop (requires CONTRACT_ID)
	@if [ -z "$(CONTRACT_ID)" ]; then \
		echo "Error: CONTRACT_ID environment variable is required"; \
		echo "Usage: make resume-operations CONTRACT_ID=<contract_id>"; \
		exit 1; \
	fi
	@echo "Disabling emergency stop on contract $(CONTRACT_ID)..."
	soroban contract invoke \
		--id $(CONTRACT_ID) \
		--source-account admin \
		--network testnet \
		-- \
		set_emergency_stop \
		--caller $(shell soroban config identity address admin) \
		--emergency_stop false