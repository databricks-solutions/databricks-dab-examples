"""
Flight Utils Unit Tests

This module contains unit tests for the flight_utils module, verifying:
- Schema definition correctness
- Data reading functionality
- Schema structure and completeness

Tests ensure that the flight data processing utilities maintain
expected behavior and data structure integrity.
"""

import sys

# Add source directory to Python path for importing local modules
sys.path.append('./src')

from flights.utils import flight_utils


def test_get_flight_schema__valid():
    """
    Test that the flight schema is correctly defined and complete.
    
    Verifies:
    - Schema is not None
    - Schema contains all 31 expected columns
    """
    schema = flight_utils.get_flight_schema()
    assert schema is not None
    assert len(schema) == 31
