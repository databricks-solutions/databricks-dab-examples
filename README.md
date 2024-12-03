# Databricks DAB Examples 

This repository provides a collection of example projects demonstrating various use cases and best practices for 
Databricks Asset Bundles (DABs). Each folder in this repo contains a self-contained project showcasing different aspects 
of DAB functionality and best practices for developer workflow and CI/CD (Continuous Integration / Continuous Deployment).

## Repo Structure

The repository is organized into multiple folders, each representing a distinct project:
- [`flights-simple`](flights-simple): Simple end to end project with workflows & DLT, source code (simple library), tests 
- [`flights-bundle-template`](flights-bundle-template): Bundle template to deploy a version of [`flights-simple`](flights-simple) with different options:
  - classic or serverless workflows
  - library packaged as wheel or using relative imports
- [`dais-2024-dab-mod-orch-template`](dais-2024-dab-mod-orch-template): Simple template for DAB
- [`sts-dabs-demo`](sts-dabs-demo) DABs simple project that includes many CICD pipeline definitions

## Getting Started
The structure of each of the folders varies according to the purpose of the project, but will include:
- A `README.md` with specific instructions
- Configuration files (such as a `databricks.yml` file defining the bundle, other YAMLs for resources)
- Source and test code
- In some instances, GH actions YAMLs

To use a project in a folder:
- Navigate to the desired folder
- Review the README for instructions
- Examine the configuration and other to understand the bundle structure
- Follow the instructions to deploy and test the bundle


## Installation

The installation of the Databricks CLI is a pre-requisite for running any of the projects.

1. Install the Databricks CLI from https://docs.databricks.com/dev-tools/cli/databricks-cli.html

2. Authenticate to your Databricks workspace:
    ```
    $ databricks configure
    ```

3. Optionally, install developer tools such as the Databricks extension for Visual Studio Code from
   https://docs.databricks.com/dev-tools/vscode-ext.html. For PyCharm proffesional, you may use 
   https://www.jetbrains.com/help/pycharm/databricks.html#connect-via-databricks-cli. Or read the "getting started" 
   [documentation](https://docs.databricks.com/en/dev-tools/databricks-connect/python/index.html) for
   **Databricks Connect** for instructions on running the included Python code from a different IDE.


## Docs & Resources
- [Databricks Asset Bundles Documentation](https://docs.databricks.com/dev-tools/bundles/index.html)
- [Databricks CLI Documentation](https://docs.databricks.com/dev-tools/cli/databricks-cli.html)
- [Databricks Connect Documentation](https://docs.databricks.com/en/dev-tools/databricks-connect/python/index.html)


## How to get help

Databricks support doesn't cover this content. For questions or bugs, please open a github issue and the team will help 
on a best effort basis.
