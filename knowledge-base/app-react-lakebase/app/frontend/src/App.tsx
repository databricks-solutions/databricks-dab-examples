import { TaxiTable } from "./components/TaxiTable";
import { TaxiChart } from "./components/TaxiChart";
import { RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { getTaxiTrips } from "./taxiApi";

export interface TaxiTrip {
  id: number;
  tpep_pickup_datetime: string;
  tpep_dropoff_datetime: string;
  trip_distance: number;
  fare_amount: number;
  pickup_zip: number;
  dropoff_zip: number;
}

function App() {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [taxiData, setTaxiData] = useState<TaxiTrip[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const data = await getTaxiTrips();
      setTaxiData(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError("Failed to fetch taxi data");
      console.error("Error fetching taxi data:", err);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  return (
    <div className="bg-[#F9F7F4] min-h-screen">
      <div className="container mx-auto max-w-screen-lg py-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
            <h1 className="text-2xl font-bold">NYC Taxi Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 flex items-center">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-[#FF3721] text-white px-4 py-2 rounded-md hover:bg-[#E62D1A] transition-colors"
            >
              <RefreshCw size={20} />
              <span>Refresh data</span>
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        {!error && (
          <>
            <TaxiChart data={taxiData} />
            <TaxiTable data={taxiData} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
