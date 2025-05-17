from pyspark.sql.functions import col, lit
from databricks.connect import DatabricksSession

table = "main.flights_dev.flights_raw"

spark = DatabricksSession.builder.serverless().getOrCreate()

df = spark.read.table(table)

df.select("UniqueCarrier", "DepTime", "FlightNum").limit(100).show()

filtered_df = df.filter(col("UniqueCarrier") == lit("CO")).limit(1000)
filtered_df.select("UniqueCarrier", "DepTime", "FlightNum").show()

spark.sql(f"Select * from {table} limit 10").show()