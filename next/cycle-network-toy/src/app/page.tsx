import React from "react";
//https://github.com/mui/material-ui/issues/40214
import Grid from "@mui/material/Grid";
import { MainViewPanel } from "@/components";
import StaticDataProvider from "@/providers/StaticDataProvider";

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
      <Grid direction="row" container justifyContent="center">
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
