from pydantic import BaseModel


class TaxiTrip(BaseModel):
    id: int
    tpep_pickup_datetime: str
    tpep_dropoff_datetime: str
    trip_distance: float
    fare_amount: float
    pickup_zip: int
    dropoff_zip: int
