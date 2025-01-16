-- Databricks notebook source
-- DBTITLE 1,Read raw

 CREATE OR REFRESH TEMPORARY STREAMING TABLE flights_dlt_raw_view
 TBLPROPERTIES (
   "quality" = "bronze"
 ) AS SELECT * FROM cloud_files(
   '${var.source_path}',
   'csv',
   map(
     "header", "true",
     "inferSchema", "true"
   )
 ) LIMIT 1000;

-- COMMAND ----------

CREATE OR REFRESH STREAMING TABLE flights_dlt_raw
COMMENT "Simple batch read of flight data"
TBLPROPERTIES (
  "quality" = "bronze"
) AS SELECT *,
  CASE
    WHEN WeatherDelay != 'NA' THEN 'WeatherDelay'
    WHEN NASDelay != 'NA' THEN 'NASDelay'
    WHEN SecurityDelay != 'NA' THEN 'SecurityDelay'
    WHEN LateAircraftDelay != 'NA' THEN 'LateAircraftDelay'
    WHEN IsArrDelayed = 'YES' OR IsDepDelayed = 'YES' THEN 'UncategorizedDelay'
  END AS delay_type,
  current_timestamp() AS last_updated_time
FROM stream(live.flights_dlt_raw_view);

-- COMMAND ----------

CREATE OR REFRESH MATERIALIZED VIEW flights_dlt_summary
COMMENT "Flight summary table"
TBLPROPERTIES ("quality" = "silver") AS
SELECT
  UniqueCarrier,
  Year,
  COUNT(*) AS flights,
  SUM(CASE WHEN delay_type IS NOT NULL THEN 1 ELSE 0 END) AS delayed_flights
FROM
  live.flights_dlt_raw
GROUP BY
  UniqueCarrier,
  Year;
