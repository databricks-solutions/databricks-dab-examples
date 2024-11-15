from pyspark.sql import SparkSession

# Create a SparkSession
spark = SparkSession.builder \
    .appName("Unity Catalog Example") \
    .getOrCreate()

table = "main.flights_dev.flights_raw"

# Connect to Unity Catalog using catalog main
spark.sql(f"""Select WeatherDelay, NASDelay, SecurityDelay, LateAircraftDelay, IsArrDelayed 
from {table} 
where WeatherDelay != 'NA' or NASDelay != 'NA' or SecurityDelay != 'NA' or LateAircraftDelay != 'NA'
limit 20""").show()

