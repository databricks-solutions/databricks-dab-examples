# flights-bundle-template

Template on top of the 'flights_simple' project to enable the following deployment options:
1. Wheels or relative imports for the project's Python modules
2. Serverless compute or classic compute for workflows

## resources
Only a template for one type of job is demonstrated right now in the `resources` directory.
- `flights_notebook_job.yml` shows a notebook job

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
