import React from "react";
import { Grid } from "@mui/material";
import { scaleOrdinal } from "d3-scale";
import { schemeSet2 } from "d3-scale-chromatic";

import { MainViewPanel } from "@/components";
import StaticDataProvider from "@/providers/StaticDataProvider";

export type EXISTING_LANE_TYPE =
  | "Sharrows"
  | "Multi-Use Trail"
  | "Cycle Track"
  | "Park Road"
  | "Bike Lane"
  | "Signed Route"
  | "Signed Route (No Pavement Markings)"
  | "Multi-Use Trail";

const existingLaneTypes: EXISTING_LANE_TYPE[] = [
  "Multi-Use Trail",
  "Sharrows",
  "Cycle Track",
  "Park Road",
  "Signed Route",
  "Multi-Use Trail",
  "Bike Lane",
];

export const existingScale = scaleOrdinal(
  existingLaneTypes,
  schemeSet2.slice(0, existingLaneTypes.length)
);

export const EXISTING_LANE_NAME_MAP: Record<string, EXISTING_LANE_TYPE> = {
  ["Sharrows - Wayfinding"]: "Sharrows",
  ["Multi-Use Trail"]: "Multi-Use Trail",
  ["Multi-Use Trail - Entrance"]: "Multi-Use Trail",
  ["Cycle Track"]: "Cycle Track",
  ["Park Road"]: "Park Road",
  ["Sharrows"]: "Sharrows",
  ["Bike Lane"]: "Bike Lane",
  ["Bi-Directional Cycle Track"]: "Cycle Track",
  ["Signed Route (No Pavement Markings)"]:
    "Signed Route (No Pavement Markings)",
  ["Bike Lane - Buffered"]: "Bike Lane",
  ["Multi-Use Trail - Connector"]: "Multi-Use Trail",
  ["Multi-Use Trail - Boulevard"]: "Multi-Use Trail",
  ["Multi-Use Trail - Existing Connector"]: "Multi-Use Trail",
  ["Bike Lane - Contraflow"]: "Bike Lane",
  ["Sharrows - Arterial"]: "Sharrows",
  ["Sharrows - Arterial - Connector"]: "Sharrows",
  ["Cycle Track - Contraflow"]: "Cycle Track",
};

export default async function Home() {
  const metricsResult = await fetch(
    `${process.env.NEXT_PUBLIC_API_ENDPOINT_INTERNAL}/metrics`
  );
  const metrics = await metricsResult.json();

  const budgetsResult = await fetch(
    `${process.env.NEXT_PUBLIC_API_ENDPOINT_INTERNAL}/budgets`
  );
  const budgets = await budgetsResult.json();

  const existingLanesResult = await fetch(
    `${process.env.NEXT_PUBLIC_API_ENDPOINT_INTERNAL}/existing-lanes`,
    {
      headers: {
        "Accept-Encoding": "gzip",
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );
  const existingLanes = await existingLanesResult.json();

  const dasResult = await fetch(
    `${process.env.NEXT_PUBLIC_API_ENDPOINT_INTERNAL}/das`,
    {
      headers: {
        "Accept-Encoding": "gzip",
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );
  const das = await dasResult.json();

  const arterialsResult = await fetch(
    `${process.env.NEXT_PUBLIC_API_ENDPOINT_INTERNAL}/arterials`
  );
  const arterials = await arterialsResult.json();

  return (
    <StaticDataProvider value={{ arterials, das, existingLanes }}>
      {/* Outer container */}
      <Grid direction="row" container justifyContent="center">
        {/* Inner column container */}
        <Grid
          alignItems="center"
          spacing={5}
          container
          flexGrow={1}
          item
          direction="column"
        >
          <MainViewPanel budgets={budgets} metrics={metrics} />
        </Grid>
      </Grid>
    </StaticDataProvider>
  );
}
