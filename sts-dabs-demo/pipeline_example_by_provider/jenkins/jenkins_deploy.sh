#!/bin/bash

# Function to handle errors
handle_error() {
    echo "Error occurred in ${1}. Exiting script."
    exit 1
}

# Set environment variables
export DATABRICKS_BUNDLE_ENV="prod"
export PROD_DIRECTORY="/Repos/JK/cicd_w_dabs_ga_jk_demo"
export DATABRICKS_AUTH_TYPE="oauth-m2m"
export DATABRICKS_HOST=$(echo "$HOST")
export DATABRICKS_CLIENT_ID=$(echo "$CLIENT_ID")
export DATABRICKS_CLIENT_SECRET=$(echo "$CLIENT_SECRET")
export DATABRICKS_TOKEN=$(echo "$TOKEN")

# Update Repo
BRANCH=$(echo "$GIT_BRANCH" | cut -d'/' -f2)
echo "Updating Databricks Repo..."
${DATABRICKS_CLIPATH}/databricks repos update ${PROD_DIRECTORY} --branch ${BRANCH}
if [ $? -ne 0 ]; then handle_error "Updating Databricks Repo"; fi

# Install Python Dependencies
echo "Installing Python dependencies..."
python -m pip install --upgrade pip
if [ $? -ne 0 ]; then handle_error "Upgrading pip"; fi

pip install -r requirements.txt
if [ $? -ne 0 ]; then handle_error "Installing Python dependencies"; fi

# Unit Testing
echo "Running Unit Tests..."
nutter run "${PROD_DIRECTORY}/tests/" --cluster_id ${CLUSTER_ID} --recursive --junit_report --timeout 900
if [ $? -ne 0 ]; then handle_error "Running Unit Tests"; fi

# Deploy to Prod
echo "Deploying to Prod..."
${DATABRICKS_CLIPATH}/databricks bundle deploy --target prod
if [ $? -ne 0 ]; then handle_error "Deploying to Prod"; fi

# Run Job
echo "Running Job..."
${DATABRICKS_CLIPATH}/databricks bundle run awesome_job --target prod
if [ $? -ne 0 ]; then handle_error "Running Job"; fi

echo "Script completed successfully."