import { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
} from "ag-grid-community";
import type { ValueFormatterParams, SortDirection } from "ag-grid-community";
import type { TaxiTrip } from "../App";

ModuleRegistry.registerModules([AllCommunityModule]);

interface TaxiTableProps {
  data: TaxiTrip[];
}

export function TaxiTable({ data }: TaxiTableProps) {
  const [columnDefs] = useState([
    {
      field: "id" as keyof TaxiTrip,
      headerName: "ID",
      width: 80,
      sort: "desc" as SortDirection,
      sortIndex: 0,
    },
    {
      field: "tpep_pickup_datetime" as keyof TaxiTrip,
      headerName: "Pickup Time",
      valueFormatter: (params: ValueFormatterParams<TaxiTrip, string>) => {
        return params.value ? new Date(params.value).toLocaleString() : "";
      },
    },
    {
      field: "tpep_dropoff_datetime" as keyof TaxiTrip,
      headerName: "Dropoff Time",
      valueFormatter: (params: ValueFormatterParams<TaxiTrip, string>) => {
        return params.value ? new Date(params.value).toLocaleString() : "";
      },
    },
    {
      field: "trip_distance" as keyof TaxiTrip,
      headerName: "Distance (miles)",
      valueFormatter: (params: ValueFormatterParams<TaxiTrip, number>) => {
        return params.value ? params.value.toFixed(2) : "";
      },
    },
    {
      field: "fare_amount" as keyof TaxiTrip,
      headerName: "Fare ($)",
      valueFormatter: (params: ValueFormatterParams<TaxiTrip, number>) => {
        return params.value ? `$${params.value.toFixed(2)}` : "";
      },
    },
    { field: "pickup_zip" as keyof TaxiTrip, headerName: "Pickup ZIP" },
    { field: "dropoff_zip" as keyof TaxiTrip, headerName: "Dropoff ZIP" },
  ]);

  const theme = themeQuartz.withParams({
    fontFamily: "DM Sans",
  });

  return (
    <div className="h-120">
      <AgGridReact
        rowData={data}
        columnDefs={columnDefs}
        pagination={true}
        paginationPageSize={20}
        theme={theme}
        gridOptions={{
          autoSizeStrategy: {
            type: "fitCellContents",
          },
        }}
      />
    </div>
  );
}
