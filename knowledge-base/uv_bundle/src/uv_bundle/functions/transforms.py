from pyspark.sql import DataFrame
import pyspark.sql.functions as F

def get_long_trips(df: DataFrame):
    return df.filter(F.col("trip_distance") > 2)