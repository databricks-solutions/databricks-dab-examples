import pytest
from pyspark.testing.utils import assertDataFrameEqual, assertSchemaEqual 

from flights.utils import flight_utils

def test_get_flight_schema__valid():
    schema = flight_utils.get_flight_schema()
    assert schema is not None
    assert len(schema) == 31