# Databricks notebook source
import dlt

# COMMAND ----------

# MAGIC %md
# MAGIC ## Read csv data (batch mode)

# COMMAND ----------

# DBTITLE 1,Setup vars and functions
import pyspark.sql.functions as F

# COMMAND ----------

# DBTITLE 1,Read raw
@dlt.table(
    temporary=True,
    comment="Test: check clean table removes null ids and has correct count"
)
@dlt.expect_all_or_fail({
    "keep_all_rows": "num_rows == 1000",
    "null_ids_removed": "null_ids == 0"
})
def test_flights_dlt_raw_counts():
    return (
        dlt.read("flights_dlt_raw")
            .select("*", F.col("FlightNum").isNull().alias("flightnum_null"))
            .select(
                F.count("*").alias("num_rows"), 
                F.sum(F.col("flightnum_null").cast("int")).alias("null_ids"))
        )

# COMMAND ----------

@dlt.table(comment="Check number of records")
@dlt.expect_or_fail("valid count", "record_count > 0")
def test_flights_dlt_summary_count_check():
  cnt = dlt.read("flights_dlt_summary").select(F.count("UniqueCarrier").alias("record_count"))
  return cnt

# COMMAND ----------

@dlt.table(comment="Check delay_type")
@dlt.expect_all_or_fail({
        "valid type": "delay_type is null or delay_type in ('UncategorizedDelay', 'WeatherDelay', 'NASDelay', 'SecurityDelay', 'LateAircraftDelay')",
        "last_updated_time is not null": "last_updated_time is not null"
})
def test_flights_dlt_raw_type_check():
  return dlt.read("flights_dlt_raw").select("delay_type", "last_updated_time")
