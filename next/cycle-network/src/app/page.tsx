import React, { Suspense } from "react";
//https://github.com/mui/material-ui/issues/40214
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import { Typography } from "@mui/material";
import { MapPage } from "@/components";

//export const dynamic = "force-dynamic"; // prevent fetches at buildtime

export default function Home() {
  return (
    <Suspense fallback={<LoadingMessage />}>
      <MapPage />
    </Suspense>
  );
}

const LoadingMessage: React.FC = () => (
  <Grid
    alignItems="center"
    container
    justifyContent="center"
    style={{ height: "100vh" }}
    direction="column"
  >
    <Grid item>
      <CircularProgress />
    </Grid>
    <Grid item>
      <Typography variant="h5">Cyclelinx is loading....</Typography>
    </Grid>
  </Grid>
);
