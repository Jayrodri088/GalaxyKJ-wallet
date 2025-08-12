default: build

all: test

test: build
	cargo test

build:
	stellar contract build
	@ls -l target/wasm32v1-none/release/*.wasm

fmt:
	cargo fmt --all

lint:
	cargo clippy -- -D warnings

clean:
	cargo clean

check:
	cargo check

audit: build
	@echo "Running security audit..."
	cargo audit

.PHONY: default all test build fmt lint clean check audit