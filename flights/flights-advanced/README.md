# flights_advanced

The 'flights_advanced' project is meant to show a small but realistic project that includes what is needed to demonstrate best practices for developer workflow and CI/CD (Continuous Integration / Continuous Deployment). You will find bundle config files `databricks.yml` in the project directory which references bundle resources in the `resources/` directory. GitHub Action to run tests and deploy are found in the `.githubs/workflows` directory.

## tests
You can run tests by setting up a local virtual environment with databricks-connect and running `py.test`. That will run the unit tests within `tests/unit_utils` and `tests/unit_transforms`.  

Another option to run tests is using a notebook, demonstrated by `tests/pyspark_testing_notebook.py`.

## resources
Various types of jobs are demonstrated in the `resources` directory.
- `flights_notebook_job_classic.yml` shows a notebook job with a few parameters and basic PyPI dependency.
- `flights_notebook_job_serverless.yml` shows a serverless notebook job with a few parameters.
- `flights_python_script_job_classic.yml` shows a Python script with parameters.
- `flights_system_test.yml` shows a simply system test to confirm library impport and permissions.
- `notebook_validation_job.yml` shows an integration test which does setup, runs the job, then a validate step to confirm results are correct.
- `pytest_notebook_job_classic.yml` shows running the pytest notebook as a task in a workflow.
- `dlt/flights_dlt.yml` shows example DLT pipeline and job to schedule that pipeline.
- `dlt/flights_dlt_validation.yml` shows running DLT pipeline plus added notebook with DLT unit tests.
- `dlt/flights_dlt_sql.yml` shows the same example of DLT pipeline translated to SQL and job to schedule that pipeline.
- `dlt/flights_dlt_sql_validation.yml` shows running DLT pipeline in SQL plus added notebook with DLT unit tests in Python.

## GitHub Actions
These are not enabled for this repository but included as examples of how we would run it. If you want to try with actions you need to have your own GitHub repository and workspace.
Setup steps:
1. Create fork of the repository or some type of GitHub repository external to the Databricks organization.
2. Move the .github folder from this flights_advanced directory into the repository root.
3. Configure the appropriate [GitHub Secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions) to allow serverless connection for unit tests and authorize bundle deployment.
4. Once these changes are pushed to GitHub, once a PR to a dev or main branch is created the action would run automatically.

## Getting started

1. Install the Databricks CLI from https://docs.databricks.com/dev-tools/cli/databricks-cli.html

2. Authenticate to your Databricks workspace:
    ```
    $ databricks configure
    ```

3. Go to root project directory then deploy a development copy of this project, type:
    ```
    $ databricks bundle deploy --target dev
    ```
    (Note that "dev" is the default target, so the `--target` parameter
    is optional here.)

    This deploys everything that's defined for this project.
    You can find the jobs by opening your workspace and clicking on **Workflows**.

4. Similarly, to deploy a production copy, type:
   ```
   $ databricks bundle deploy --target prod
   ```

5. To run a job or pipeline, use the "run" command:
   ```
   $ databricks bundle run notebook_validation_job --params "catalog=main;database=dustinvannoy_dev"
   ```

6. Optionally, install developer tools such as the Databricks extension for Visual Studio Code from
   https://docs.databricks.com/dev-tools/vscode-ext.html. Or read the "getting started" documentation for
   **Databricks Connect** for instructions on running the included Python code from a different IDE.

7. For documentation on the Databricks asset bundles format used
   for this project, and for CI/CD configuration, see
   https://docs.databricks.com/dev-tools/bundles/index.html.


## Testing Advanced Bundle Commands

Deploy the bundle from the terminal so you can override the schema name variable without changing the value in databricks.yml. Use the following command to set the variable during deploy.

    ```bash
    databricks bundle deploy --var "schema_short_name=tmp_schema"
    ```
    **Note:** It will prompt to recreate the DLT pipeline. In this case you can choose yes.


Run a job passing in parameter overrides.

   ```bash
   databricks bundle run notebook_validation_job --params "flights_test_schema=tmp_validation_schema"
   ```
