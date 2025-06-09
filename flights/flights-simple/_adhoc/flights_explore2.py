from databricks.connect import DatabricksSession
from pyspark.sql.functions import col, lit
import pandas as pd

reference_data = pd.read_csv("_adhoc/data/T_CARRIER_DECODE.csv", header=0)

print(reference_data.head())

# Create a SparkSession
spark = DatabricksSession.builder \
    .getOrCreate()

table = "main.flights_dev.flights_raw"

df = spark.read.table(table)

df.select("UniqueCarrier", "DepTime", "FlightNum").limit(100).show()

filtered_df = df.filter(col("UniqueCarrier") == lit("CO")).limit(1000)
filtered_df.select("UniqueCarrier", "DepTime", "FlightNum").show()