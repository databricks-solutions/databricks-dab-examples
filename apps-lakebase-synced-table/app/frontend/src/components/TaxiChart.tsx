import { useState } from "react";
import { AgCharts } from "ag-charts-react";
import type { AgChartOptions } from "ag-charts-community";
import type { TaxiTrip } from "../App";

interface TaxiChartProps {
  data: TaxiTrip[];
}

export function TaxiChart({ data }: TaxiChartProps) {
  const [chartOptions] = useState<AgChartOptions>({
    title: {
      text: "Daily fare trends",
      fontFamily: "DM Sans",
    },
    subtitle: {
      text: "Distance vs Fare Amount",
      fontFamily: "DM Sans",
    },
    theme: {
      palette: {
        fills: ["#FF3722"],
        strokes: ["#C82B1B"],
      },
    },
    series: [
      {
        type: "scatter",
        title: "Taxi Trips",
        xKey: "trip_distance",
        xName: "Trip distance",
        yKey: "fare_amount",
        yName: "Fare Amount",
        marker: {
          fill: "#FF3722",
          stroke: "#C82B1B",
          strokeWidth: 1,
          size: 8,
        },
      } as any,
    ],
    axes: [
      {
        type: "number",
        position: "bottom",
        title: {
          text: "Distance",
          fontFamily: "DM Sans",
        },
        label: {
          fontFamily: "DM Sans",
          formatter: (params: any) => {
            return params.value + " miles";
          },
        },
      } as any,
      {
        type: "number",
        position: "left",
        title: {
          text: "Fare",
          fontFamily: "DM Sans",
        },
        label: {
          fontFamily: "DM Sans",
          formatter: (params: any) => {
            return "$" + params.value;
          },
        },
      } as any,
    ],
  });

  return (
    <div className="mb-6">
      <div className="border border-[#DCDDDD] rounded-lg overflow-hidden">
        <AgCharts options={{ ...chartOptions, data }} />
      </div>
    </div>
  );
}
