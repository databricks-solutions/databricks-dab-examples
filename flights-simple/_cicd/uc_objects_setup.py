import sys

try:
    catalog = sys.argv[1]
except IndexError:
    catalog = "main"
try:
    flights_schema = sys.argv[2]
except IndexError:
    flights_schema = "flights_dev"

try:
    flights_validation_schema = sys.argv[3]
except IndexError:
    flights_validation_schema = "flights_validation_dev"

# tables = ["flights_raw"]

try:
    from databricks.connect import DatabricksSession
    spark = DatabricksSession.builder.getOrCreate()
except ModuleNotFoundError:
    from pyspark.sql import SparkSession
    spark = SparkSession.builder.getOrCreate()
    
spark.sql(f"CREATE SCHEMA IF NOT EXISTS {catalog}.{flights_schema};")
spark.sql(f"CREATE SCHEMA IF NOT EXISTS {catalog}.{flights_validation_schema};")