import React from "react";
//https://github.com/mui/material-ui/issues/40214
import Grid from "@mui/material/Grid";
import { MainViewPanel } from "@/components";
import arterials from "@/lib/geojson/arterials.json";
import budgets from "@/lib/geojson/budgets.json";
import das from "@/lib/geojson/das.json";
import defaults from "@/lib/geojson/defaults.json";
import existingLanes from "@/lib/geojson/existing.json";
import metrics from "@/lib/geojson/metrics.json";
import StaticDataProvider from "@/providers/StaticDataProvider";
import {
  ArterialFeatureGeoJSON,
  DAGeoJSON,
  DefaultScores,
  ExistingLaneGeoJSON,
} from "@/lib/ts/types";

//export const dynamic = "force-dynamic"; // prevent fetches at buildtime

export default async function MapPage() {
  return (
    <StaticDataProvider
      value={{
        arterials: arterials as ArterialFeatureGeoJSON,
        das: das as DAGeoJSON,
        defaultScores: defaults as DefaultScores,
        existingLanes: existingLanes as ExistingLaneGeoJSON,
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
            arterials={arterials as ArterialFeatureGeoJSON}
            budgets={budgets}
            das={das as DAGeoJSON}
            defaultScores={defaults as DefaultScores}
            metrics={metrics}
          />
        </Grid>
      </Grid>
    </StaticDataProvider>
  );
}
