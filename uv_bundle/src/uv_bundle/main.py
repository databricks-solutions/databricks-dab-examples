from pyspark.sql import SparkSession, DataFrame
from uv_bundle.functions.transforms import get_long_trips

def get_taxis(spark: SparkSession) -> DataFrame:
  return spark.read.table("samples.nyctaxi.trips")

def get_spark() -> SparkSession:
    try:
        from databricks.connect import DatabricksSession
        return DatabricksSession.builder.getOrCreate()
    except ImportError:
        return SparkSession.builder.getOrCreate()

def main():
    df = get_taxis(get_spark())
    get_long_trips(df).show(10)


if __name__ == "__main__":
    main()
