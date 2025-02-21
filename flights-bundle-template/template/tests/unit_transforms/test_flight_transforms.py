"""
Flight Transforms Unit Tests

This module contains unit tests for the flight_transforms module, focusing on:
- Delay type categorization logic
- Edge cases in delay classification
- Data transformation accuracy

Tests ensure that flight delays are correctly categorized based on
the defined business rules and priority order:
Weather > NAS > Security > Late Aircraft > Uncategorized
"""

import sys

import pytest
from pyspark.testing.utils import assertDataFrameEqual

# Add source directory to Python path for importing local modules
sys.path.append("./src")

from flights.transforms import flight_transforms


@pytest.fixture(scope="module")
def spark_session():
    """
    Create and return a Databricks Connect session for testing.

    Scoped to module level to reuse session across tests.
    """
    from databricks.connect import DatabricksSession

    return DatabricksSession.builder.getOrCreate()


def test_delay_type_transform__valid(spark_session):
    """
    Test delay type categorization with various delay scenarios.

    Tests the following cases:
    - Individual delay types (Weather, NAS, Security, Late Aircraft)
    - Uncategorized delays (when only IsArrDelayed/IsDepDelayed are YES)
    - Multiple delay types (should follow priority order)
    """
    # Create test input with various delay scenarios
    input_df = spark_session.createDataFrame(
        [
            ["0", "NA", "NA", "NA", "NO", "NO"],  # Weather delay
            ["NA", "0", "NA", "NA", "NO", "NO"],  # NAS delay
            ["NA", "NA", "0", "NA", "NO", "NO"],  # Security delay
            ["NA", "NA", "NA", "0", "NO", "NO"],  # Late Aircraft delay
            ["NA", "NA", "NA", "NA", "YES", "NO"],  # Uncategorized (arrival)
            ["NA", "NA", "NA", "NA", "NO", "YES"],  # Uncategorized (departure)
            ["0", "0", "0", "0", "YES", "YES"],  # Multiple delays (Weather wins)
        ],
        [
            "WeatherDelay",
            "NASDelay",
            "SecurityDelay",
            "LateAircraftDelay",
            "IsArrDelayed",
            "IsDepDelayed",
        ],
    )

    # Define expected results based on delay priority
    expected_data = [
        ["WeatherDelay"],
        ["NASDelay"],
        ["SecurityDelay"],
        ["LateAircraftDelay"],
        ["UncategorizedDelay"],
        ["UncategorizedDelay"],
        ["WeatherDelay"],
    ]

    expected_df = spark_session.createDataFrame(expected_data, ["delay_type"])

    # Apply transformation and verify results
    result_df = flight_transforms.delay_type_transform(input_df)
    assertDataFrameEqual(result_df.select("delay_type"), expected_df)
    assertDataFrameEqual(result_df.select("delay_type"), expected_df)
