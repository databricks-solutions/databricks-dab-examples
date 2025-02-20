# uv_bundle

This project aims to demonstrate how ```uv``` works for creating and running databricks projects, backed by ```databricks-connect```

## Prerequisites

1. Install the Databricks CLI from https://docs.databricks.com/dev-tools/cli/databricks-cli.html

2. Authenticate to your Databricks workspace, if you have not done so already:
    ```
    $ databricks configure
    ```
    This project assumes that you have set a DEFAULT environment already to your ```./databrickscfg```

## Installation

1. Install uv from https://docs.astral.sh/uv/getting-started/installation/

2. Install all the project dependencies
    ```
    $ uv sync --dev
    ```
    This will cofigure a local environment with the following dependencies installed
      - databricks-connect
      - pytest

3. Run the tests
    ```
    $ uv run pytest
    ```
    All the unit tests will be run using ```databricks-connect```

## Deployment

1. To deploy a development copy of this project, type:
    ```
    $ databricks bundle deploy
    ```

    This deploys a workflow with a wheel file created by uv.
    For example, the default template would deploy a job called
    `[dev yourname] uv_bundle_job` to your workspace.
    You can find that job by opening your workpace and clicking on **Workflows**.

2. To run a job or pipeline, use the "run" command:
   ```
   $ databricks bundle run uv_bundle_job
   ```
