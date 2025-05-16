from pyspark.sql.functions import col, lit
import argparse

def get_args():
    parser = argparse.ArgumentParser(description='Example of parsing arguments with defaults')

    # Add arguments with default values
    parser.add_argument('-c', '--catalog', type=str, default='main', help='Target catalog')
    parser.add_argument('-d', '--database', type=str, default='dustinvannoy_dev', help='Target schema/database')
    
    return parser.parse_args()


args = get_args()

print(f'{args.catalog}.{args.database}')

table = f"{args.catalog}.{args.database}.flights_raw"

df = spark.read.table(table)

df.select("UniqueCarrier", "DepTime", "FlightNum").limit(100).show()

filtered_df = df.filter(col("UniqueCarrier") == lit("CO")).limit(1000)
filtered_df.select("UniqueCarrier", "DepTime", "FlightNum").show()