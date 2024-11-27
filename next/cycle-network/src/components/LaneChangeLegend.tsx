import React from "react";
import { Box, Grid, Typography } from "@mui/material";

interface LaneChangeLegendProps {
  color: string;
  label: string;
}

const LaneChangeLegend: React.FC<LaneChangeLegendProps> = ({
  color,
  label,
}) => (
  <Grid
    item
    container
    spacing={3}
    alignItems="center"
    direction="row"
    wrap="nowrap"
  >
    <Grid item xs={6}>
      <Box
        sx={(theme) => ({
          backgroundColor: color,
          height: "5px",
        })}
      />
    </Grid>
    <Grid item xs={6}>
      <Typography variant="caption">{label}</Typography>
    </Grid>
  </Grid>
);

export default LaneChangeLegend;
