import pytest
from pyspark.testing.utils import assertDataFrameEqual, assertSchemaEqual 
import sys

sys.path.append('./src')

from flights.transforms import flight_transforms

@pytest.fixture(scope="module")
def spark_session():
    try:
        from databricks.connect import DatabricksSession
        return DatabricksSession.builder.getOrCreate()   
    # except (ValueError, RuntimeError):
    #     from databricks.connect import DatabricksSession
    #     return DatabricksSession.builder.profile("unit_tests").getOrCreate()    
    except ImportError:
        print("No Databricks Connect, build and return local SparkSession")
        from pyspark.sql import SparkSession
        return SparkSession.builder.getOrCreate()


def test_delay_type_transform__valid(spark_session):
    input_df = spark_session.createDataFrame([
        ["0","NA","NA","NA", "NO", "NO"],
        ["NA","0","NA","NA", "NO", "NO"],
        ["NA","NA","0","NA", "NO", "NO"],
        ["NA","NA","NA", "0", "NO", "NO"],
        ["NA","NA","NA","NA", "YES", "NO"],
        ["NA","NA","NA","NA", "NO", "YES"],
        ["0","0","0","0", "YES", "YES"],
    ], ["WeatherDelay", "NASDelay", "SecurityDelay", "LateAircraftDelay", "IsArrDelayed", "IsDepDelayed"])

    expected_data = [
        ['WeatherDelay'], 
        ['NASDelay'], 
        ['SecurityDelay'], 
        ['LateAircraftDelay'],
        ['UncategorizedDelay'],
        ['UncategorizedDelay'],
        ['WeatherDelay']
    ]

    expected_df = spark_session.createDataFrame(expected_data,["delay_type"])

    result_df = flight_transforms.delay_type_transform(input_df)

    assertDataFrameEqual(result_df.select("delay_type"), expected_df)
    

