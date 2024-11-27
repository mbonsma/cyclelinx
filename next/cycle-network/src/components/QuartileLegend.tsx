import React from "react";
import { ScaleQuantile } from "d3-scale";
import { Box, Grid, Typography } from "@mui/material";
import { formatDigit } from "@/lib/ts/util";

interface QuartileLegendProps {
  color: string;
  height: number;
  scale: ScaleQuantile<number, number>;
}

const QuartileLegend: React.FC<QuartileLegendProps> = ({
  color,
  height,
  scale,
}) => {
  return (
    <Grid
      container
      item
      spacing={2}
      direction="row"
      wrap="nowrap"
      justifyContent="space-around"
    >
      {scale.range().map((r) => {
        const [v0, v1] = scale.invertExtent(r);
        const label = `${formatDigit(v0)}-${formatDigit(v1)}`;
        return (
          <Grid
            key={r}
            direction="column"
            item
            container
            justifyContent="space-between"
          >
            <Grid item>
              <Typography variant="caption">{label}</Typography>
            </Grid>
            <Grid
              item
              component={Box}
              sx={{ backgroundColor: color, opacity: r, height }}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default QuartileLegend;
