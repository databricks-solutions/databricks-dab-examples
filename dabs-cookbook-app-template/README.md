# bundle-app-template

Template on top of the [Databricks Apps Cookbook](https://github.com/pbv0/databricks-apps-cookbook) project to enable the following deployment options:
1. Databricks App  with some recipes and resources.

## Resources
Building blocks of a Databricks App.
- `app.yml` shows a template for an app with a few parameters needed to deploy a Databricks App.


## Getting started

1. Install the Databricks CLI from https://docs.databricks.com/dev-tools/cli/databricks-cli.html

2. Authenticate to your Databricks workspace:
    ```
    $ databricks configure
    ```
3. Move into a directory in which you will generate the new bundle

4. On the target directory, generate the bundle make your choices in the prompt
    ```
    $ databricks bundle init https://github.com/databricks-solutions/databricks-dab-examples --template-dir bundle-app-template --profile <your CLI profile>
    ```
   Example:
    ```
    Please provide the following details to tailor the template to your preferences.
   
    Unique name for this project
    project_name [dabs-app]: my-databricks-app

    Your bundle 'my-databricks-app' has been created.
    ```

5. Deploy a development copy of this project, type:
    ```
    $ databricks bundle deploy --profile <your CLI profile> --target dev
    ```
    (Note that "dev" is the default target, so the `--target` parameter
    is optional here.)

    This deploys everything that's defined for this project.
    You can find the jobs by opening your workspace and clicking on **Workflows**.


6. To start the app and execute app deployment, use the "run" command:
   ```
   $ databricks bundle run my-databricks-app --profile <your CLI profile>
   ```
7. To open the deployed app, use the "open" command:
   ```
   $ databricks bundle open my-databricks-app --profile <your CLI profile>
   ```

### Credits  
Special thanks to [pbv0](https://github.com/pbv0/) for his repo with the [Databricks Apps Cookbook!](https://github.com/pbv0/databricks-apps-cookbook) 