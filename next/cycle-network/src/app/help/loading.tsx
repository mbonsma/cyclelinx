"use client";

import React from "react";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { Grid } from "@mui/material";

const LoadingOverlay: React.FC<{ open: boolean; message?: string }> = () => {
  return (
    <Backdrop
      sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={true}
    >
      <Grid container direction="column" spacing={2} alignItems="center">
        <Grid item>
          <CircularProgress color="inherit" />
        </Grid>
      </Grid>
    </Backdrop>
  );
};

export default LoadingOverlay;
