# Databricks notebook source
dbutils.widgets.text("catalog", "main")
dbutils.widgets.text("database", "flights_dev")
# artifact_path = f'{dbutils.widgets.get("artifact_path")}/.internal'

# COMMAND ----------

# TODO this is needed for serverless only, as a temp solution
# %pip install {artifact_path}/flights-0.0.1-py3-none-any.whl

# COMMAND ----------

# MAGIC %md
# MAGIC ## Read csv data (batch mode)

# COMMAND ----------

# DBTITLE 1,Setup vars and functions
from flights.transforms import flight_transforms, shared_transforms
from flights.utils import flight_utils

from flights.utils import flight_utils

catalog = dbutils.widgets.get("catalog")
database = dbutils.widgets.get("database")

path = "/databricks-datasets/airlines"
raw_table_name = f"{catalog}.{database}.flights_raw"


# COMMAND ----------

# DBTITLE 1,Read raw
df = flight_utils.read_batch(spark, path).limit(1000)
display(df)

# COMMAND ----------

# MAGIC %md
# MAGIC ## Transform data

# COMMAND ----------
df_transformed = (
        df.transform(flight_transforms.delay_type_transform)
          .transform(shared_transforms.add_metadata_columns)
    )

# COMMAND ----------

# MAGIC %md
# MAGIC ## Write raw Delta Lake table (batch mode)

# COMMAND ----------

df_transformed.write.format("delta").mode("append").saveAsTable(raw_table_name)
print(f"Succesfully wrote data to {raw_table_name}")