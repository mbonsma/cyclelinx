import { Box, Grid, Typography } from "@mui/material";
import React from "react";

interface BinaryLegendProps {
  color: string;
  height: number;
  label: string;
}

const BinaryLegend: React.FC<BinaryLegendProps> = ({
  color,
  height,
  label,
}) => (
  <Grid item container direction="row" spacing={1} alignItems="baseline">
    <Grid item>
      <Box sx={{ backgroundColor: color, height, width: height }} />
    </Grid>
    <Grid item>
      <Typography variant="caption">{label}</Typography>
    </Grid>
  </Grid>
);

export default BinaryLegend;
