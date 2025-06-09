# Databricks notebook source
import dlt
import sys, os
artifact_path = spark.conf.get("artifact_path")
sys.path.append(os.path.abspath(artifact_path))

# COMMAND ----------

# MAGIC %md
# MAGIC ## Read csv data (batch mode)

# COMMAND ----------


# DBTITLE 1,Setup vars and functions
from flights.transforms import flight_transforms, shared_transforms
from flights.utils import flight_utils
from pyspark.sql.functions import count, sum, expr
path = spark.conf.get("var.source_path")

# COMMAND ----------

# DBTITLE 1,Read raw
@dlt.table(comment="Simple batch read of flight data")

def flights_dlt_raw():
    print("Starting process for flights_dlt_raw")
    df = flight_utils.read_batch(spark, path).limit(1000)
    df_transformed = (
        df.transform(flight_transforms.delay_type_transform)
          .transform(shared_transforms.add_metadata_columns)
    )
    return df_transformed

print(f"Succesfully wrote data to flights_dlt_raw")

# COMMAND ----------

@dlt.table(comment="Flight summary table")
def flights_dlt_summary():
    df = dlt.read("flights_dlt_raw").withColumn("is_delayed", expr("case when delay_type is not null then 1 else 0 end"))
    df_summary = df.groupBy("UniqueCarrier", "Year"
        ).agg(
            count("*").alias("flights"), 
            sum("is_delayed").alias("delayed_flights")
        )
    return df_summary
