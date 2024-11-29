"""Python functions to test
These represent Python functions that you would keep in a Python file and import to test.
"""
from pyspark.sql.functions import current_timestamp, current_date, col

def add_metadata_columns(df, include_time=True):
    if include_time:
        df = df.withColumn("last_updated_time", current_timestamp())
    else:
        df = df.withColumn("last_updated_date", current_date())
     
    df = df.withColumn("source_file", col("_metadata.file_path"))
    return df
