from pyspark.sql.types import StructType, StructField, IntegerType, StringType


def get_flight_schema():
    schema = StructType([
      StructField("Year", IntegerType(), True),
      StructField("Month", IntegerType(), True),
      StructField("DayofMonth", IntegerType(), True),
      StructField("DayOfWeek", IntegerType(), True),
      StructField("DepTime", StringType(), True),
      StructField("CRSDepTime", IntegerType(), True),
      StructField("ArrTime", StringType(), True),
      StructField("CRSArrTime", IntegerType(), True),
      StructField("UniqueCarrier", StringType(), True),
      StructField("FlightNum", IntegerType(), True),
      StructField("TailNum", StringType(), True),
      StructField("ActualElapsedTime", StringType(), True),
      StructField("CRSElapsedTime", IntegerType(), True),
      StructField("AirTime", StringType(), True),
      StructField("ArrDelay", StringType(), True),
      StructField("DepDelay", StringType(), True),
      StructField("Origin", StringType(), True),
      StructField("Dest", StringType(), True),
      StructField("Distance", StringType(), True),
      StructField("TaxiIn", StringType(), True),
      StructField("TaxiOut", StringType(), True),
      StructField("Cancelled", IntegerType(), True),
      StructField("CancellationCode", StringType(), True),
      StructField("Diverted", IntegerType(), True),
      StructField("CarrierDelay", StringType(), True),
      StructField("WeatherDelay", StringType(), True),
      StructField("NASDelay", StringType(), True),
      StructField("SecurityDelay", StringType(), True),
      StructField("LateAircraftDelay", StringType(), True),
      StructField("IsArrDelayed", StringType(), True),
      StructField("IsDepDelayed", StringType(), True)
    ])
    return schema


def read_batch(spark, path):
    schema = get_flight_schema()
  
    batch_df = (spark.read.format("csv")
      .option("header", "false")
      .schema(schema)
      .load(path)
    )
  
    return batch_df


def read_autoloader(spark, path):
  schema = get_flight_schema()
  
  streaming_df = spark.readStream.format("cloudFiles") \
      .option("cloudFiles.format", "csv") \
      .option("cloudFiles.includeExistingFiles", "true") \
      .schema(schema) \
      .load(path)
  
  return streaming_df