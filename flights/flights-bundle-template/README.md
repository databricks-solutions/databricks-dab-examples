# flights-bundle-template

Template on top of the [flights_simple](../flights-simple) project to enable the following deployment options:
1. Wheels or relative imports for the project's Python modules
2. Serverless compute or classic compute for workflows
3. Liquibase example setup

## Resources
A subset of [flights_simple](../flights-simple) resources are currently demonstrated at the [template resources dir](template/resources/).
- `flights_notebook_job.yml` shows a template for a notebook job with a few parameters, a basic PyPi dependency plus the custom wheel (if selected).
- `flights_python_script_job_classic.yml` shows a template for a Python script with parameters.
- `dlt/flights_dlt.yml` shows a template for a DLT pipeline and a job to schedule that pipeline.


## Getting started

1. Install the Databricks CLI from https://docs.databricks.com/dev-tools/cli/databricks-cli.html

2. Authenticate to your Databricks workspace:
    ```
    $ databricks configure
    ```
3. Create a directory in which you will generate the new bundle

4. From the new directory, generate the bundle -make your choices in the prompt
    ```
    $ databricks bundle init ../flights-bundle-template --profile <your CLI profile>
    ```
   Example:
    ```
    What is the name of the bundle you want to create? [flights-gen-bundle]: flights-serverless-no-wheels
    Do you want to generate wheels for the project's Python modules (instead of using relative imports)? [false]:
    Do you want the Databricks workflows to run on serverless? [false]: true

    Your bundle 'flights-serverless-no-wheels' has been created.
    ```

5. Deploy a development copy of this project, type:
    ```
    $ databricks bundle deploy --profile <your CLI profile> --target dev
    ```
    (Note that "dev" is the default target, so the `--target` parameter
    is optional here.)

    This deploys everything that's defined for this project.
    You can find the jobs by opening your workspace and clicking on **Workflows**.


6. To run a job or pipeline, use the "run" command:
   ```
   $ databricks bundle run flights_notebook --profile <your CLI profile>
   ```

## Liquibase
If Liquibase is enabled, the template creates a GH action under `./.github/workflows/flights_liquibase.yml` which
- Downloads the Liquibase CLI + required JDBC driver and jars
- Runs a liquibase connection test and updates the changelog
- Runs local tests
- Deploys the bundle in target env and runs a job

### GH setup
Liquibase requires the following variables set in GitHub:
- `DATABRICKS_HOST`: e.g. `dbc-eae35cd0-9e95.cloud.databricks.com`
- `DATABRICKS_JDBC_URL`: DWH url e.g. `jdbc:databricks://dbc-eae35cd0-9e95.cloud.databricks.com:443/default;transportMode=http;ssl=1;AuthMech=3;httpPath=/sql/1.0/warehouses/863bcc7ff8fea25b;`
- `LIQUIBASE_CATALOG_NAME`: a catalog name e.g. `main`
- `LIQUIBASE_SCHEMA_NAME`: a schema name e.g. `liquibase_test`

Plus the secret:
- `DATABRICKS_TOKEN_TST`: Databricks token for deployment environment
