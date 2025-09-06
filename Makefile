all:
	cd wasm && RUST_BIGDECIMAL_DEFAULT_PRECISION=60 wasm-pack build --target web
	mkdir -p docs/wasm
	cp wasm/pkg/three_body_wasm.js docs/wasm
	cp wasm/pkg/three_body_wasm_bg.wasm docs/wasm

serve:
	python -m http.server --directory docs