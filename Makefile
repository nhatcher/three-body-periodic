all:
	cd wasm && wasm-pack build --target web
	mkdir -p app/pkg
	cp wasm/pkg/three_body_wasm.js app/pkg
	cp wasm/pkg/three_body_wasm_bg.wasm app/pkg

serve:
	python -m http.server --directory app