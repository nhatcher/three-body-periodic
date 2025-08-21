all:
	cd wasm && wasm-pack build --target web
	mkdir -p app/wasm
	cp wasm/pkg/three_body_wasm.js app/wasm
	cp wasm/pkg/three_body_wasm_bg.wasm app/wasm

serve:
	python -m http.server --directory app