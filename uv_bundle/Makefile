clean:
	rm -fr .venv uv.lock

dev:
	uv sync --dev

test:
	uv run pytest

deploy:
	databricks bundle deploy

run:
	databricks bundle run uv_bundle_job