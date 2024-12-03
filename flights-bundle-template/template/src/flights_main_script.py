import argparse

from flights.transforms import flight_transforms, shared_transforms
from flights.utils import flight_utils

from flights.utils import flight_utils

def get_args():
    parser = argparse.ArgumentParser(description='Example of parsing arguments with defaults')

    # Add arguments with default values
    parser.add_argument('-c', '--catalog', type=str, default='main', help='Target catalog')
    parser.add_argument('-d', '--database', type=str, default='dustinvannoy_dev', help='Target schema/database')
    return parser.parse_args()

args = get_args()

## Read csv data (batch mode)
path = "/databricks-datasets/airlines"
raw_table_name = f"{args.catalog}.{args.database}.flights_raw"

df = flight_utils.read_batch(spark, path).limit(1000)

## Transform data
df_transformed = (
        df.transform(flight_transforms.delay_type_transform)
          .transform(shared_transforms.add_metadata_columns)
    )

## Write raw Delta Lake table (batch mode)
df_transformed.write.format("delta").mode("append").saveAsTable(raw_table_name)
print(f"Succesfully wrote data to {raw_table_name}")
