from src.uv_bundle.functions.transforms import get_long_trips
from pyspark.sql import SparkSession

def get_spark() -> SparkSession:
    try:
        from databricks.connect import DatabricksSession
        return DatabricksSession.builder.getOrCreate()
    except ImportError:
        return SparkSession.builder.getOrCreate()

spark = get_spark()

def test_spark_session_sql():
    df = spark.createDataFrame([[2.4, 8.0], [0.4, 1.0]] , ["trip_distance", "fare_amount"])
    assert len(get_long_trips(df).collect()) == 1
