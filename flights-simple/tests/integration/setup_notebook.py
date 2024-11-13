# Databricks notebook source
# MAGIC %md
# MAGIC # Test Setup notebook
# MAGIC
# MAGIC This notebook is executed using Databricks Workflows as defined in resources/notebook_validation_job.yml. It is used to check setup test tables for the notebook validation test.

# COMMAND ----------

dbutils.widgets.text("catalog", "main")
dbutils.widgets.text("database", "flights_dev")

# COMMAND ----------

catalog = dbutils.widgets.get("catalog")
database = dbutils.widgets.get("database")

# COMMAND ----------

# MAGIC %sql
# MAGIC CREATE SCHEMA IF NOT EXISTS IDENTIFIER(:catalog || '.' || :database);

# COMMAND ----------

# MAGIC %sql
# MAGIC DROP TABLE IF EXISTS IDENTIFIER(:catalog || '.' || :database || '.flights_raw');
