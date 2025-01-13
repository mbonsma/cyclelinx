import React from "react";
//https://github.com/mui/material-ui/issues/40214
import { promises as fs } from "fs";
import path from "path";
import Grid from "@mui/material/Grid";
import { MainViewPanel } from "@/components";
// import existingLanes from "@/lib/geojson/existing.json";
// import das from "@/lib/geojson/das.json";
// import arterials from "@/lib/geojson/arterials.json";
import StaticDataProvider from "@/providers/StaticDataProvider";
import {
  ArterialFeatureGeoJSON,
  DAGeoJSON,
  DefaultScores,
  ExistingLaneGeoJSON,
} from "@/lib/ts/types";

export const dynamic = "force-dynamic"; // prevent fetches at buildtime

export default async function MapPage() {
  const metricsResult = await fetch(
    `${process.env.NEXT_PUBLIC_API_ENDPOINT_INTERNAL}/metrics`
  );
  const metrics = await metricsResult.json();

  const budgetsResult = await fetch(
    `${process.env.NEXT_PUBLIC_API_ENDPOINT_INTERNAL}/budgets`
  );
  const budgets = await budgetsResult.json();

  // const existingLanesResult = await fetch(
  //   `${process.env.NEXT_PUBLIC_API_ENDPOINT_INTERNAL}/existing-lanes`,
  //   {
  //     headers: {
  //       "Accept-Encoding": "gzip",
  //       Accept: "application/json",
  //     },
  //     cache: "no-store",
  //   }
  // );
  // const existingLanes = await existingLanesResult.json();

  // const dasResult = await fetch(
  //   `${process.env.NEXT_PUBLIC_API_ENDPOINT_INTERNAL}/das`,
  //   {
  //     headers: {
  //       "Accept-Encoding": "gzip",
  //       Accept: "application/json",
  //     },
  //     cache: "no-store",
  //   }
  // );
  // const das = await dasResult.json();

  // const arterialsResult = await fetch(
  //   `${process.env.NEXT_PUBLIC_API_ENDPOINT_INTERNAL}/arterials`
  // );
  // const arterials = await arterialsResult.json();

  // const defaultScoresResult = await fetch(
  //   `${process.env.NEXT_PUBLIC_API_ENDPOINT_INTERNAL}/default-scores`
  // );
  // const defaultScores = await defaultScoresResult.json();

  // const intersectionsResult = await fetch(
  //   `${process.env.NEXT_PUBLIC_API_ENDPOINT_INTERNAL}/intersections`
  // );
  // const intersections = await intersectionsResult.json();

  const arterials = JSON.parse(
    await fs.readFile(
      path.join(process.cwd() + "/src/lib/geojson/arterials.geojson"),
      "utf8"
    )
  ) as ArterialFeatureGeoJSON;

  const das = JSON.parse(
    await fs.readFile(
      path.join(process.cwd() + "/src/lib/geojson/das.geojson"),
      "utf8"
    )
  ) as DAGeoJSON;

  const existingLanes = JSON.parse(
    await fs.readFile(
      path.join(process.cwd() + "/src/lib/geojson/existing.geojson"),
      "utf8"
    )
  ) as ExistingLaneGeoJSON;

  const defaultScores = JSON.parse(
    await fs.readFile(
      path.join(process.cwd() + "/src/lib/geojson/defaults.geojson"),
      "utf8"
    )
  ) as DefaultScores;

  return (
    <StaticDataProvider
      value={{
        arterials,
        das,
        defaultScores,
        existingLanes,
        intersections: null, //leaving for now, in case we need to put back in
      }}
    >
      <Grid direction="row" container justifyContent="center">
        <Grid
          alignItems="center"
          spacing={5}
          container
          flexGrow={1}
          item
          direction="column"
        >
          <MainViewPanel
            arterials={arterials}
            budgets={budgets}
            das={das}
            defaultScores={defaultScores}
            metrics={metrics}
          />
        </Grid>
      </Grid>
    </StaticDataProvider>
  );
}
