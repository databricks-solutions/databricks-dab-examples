import json
import argparse
import subprocess

# Add parser for command line arguments
parser = argparse.ArgumentParser()
parser.add_argument("--target", help="DAB target name (dev, prod, etc.)", required=True)
parser.add_argument("--profile", help="CLI profile to use", required=True)

args = parser.parse_args()

def run_subprocess(cmd:list) -> str:
    """Runs process and returns stdout
    
    Args:
        cmd (list): Process command and arguments
    
    Returns:
        str: Standard output (stdout) of the process
    
    Raises:
        CalledProcessError: If process fails
    """
    
    try:
        result = subprocess.run(
            cmd,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error: Command '{e.cmd}' failed with status {e.returncode}.\nStderr: {e.stderr}")
        raise

def update_dashboard_dataset_params(catalog, schema, file_path:str = 'src/dbsql_metrics.lvdash.json') -> None:
    """Updates dataset parameters for `catalog` and `schema` in AI/BI json deployment file
    
    Args:
        file_path (str): Path to deployment file
    """

    # Open dashboard file and deserialize json
    with open(file_path, 'r+') as f:
        dashboard_data = json.load(f)
        f.seek(0)
    
        # Update catalog and schema values in each dataset
        for dataset in dashboard_data.get('datasets', []):
            for param in dataset.get('parameters', []):
                if param.get('keyword') == 'catalog':
                    param['defaultSelection']['values']['values'][0]['value'] = catalog
                    print(f"Updated catalog parameter in dataset {dataset['displayName']} to: {catalog}")
                elif param.get('keyword') == 'schema':
                    param['defaultSelection']['values']['values'][0]['value'] = schema
                    print(f"Updated schema parameter in dataset {dataset['displayName']} to: {schema}")
        
        # Overwrite dashboard file
        json.dump(dashboard_data, f, indent=2)
        f.truncate()
        
        print(f"Successfully updated {file_path} with catalog '{catalog}' and schema '{schema}'")

# Create and run CLI bundle command
cmd = ["databricks", "bundle", "validate", "-o", "json", "-t", args.target, "-p", args.profile]
result = run_subprocess(cmd)

# Deserialize the JSON string
data = json.loads(result)
catalog = data['variables']['catalog']['value']
schema = data['variables']['schema']['value']

print(f"Using target environment: {args.target}")
print(f"Using catalog: {catalog}")
print(f"Using schema: {schema}")

# Update dataset parameters in dashboard deployment file
update_dashboard_dataset_params(catalog, schema)