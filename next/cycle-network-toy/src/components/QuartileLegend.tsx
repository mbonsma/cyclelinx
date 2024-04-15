import React from "react";
import { ScaleQuantile } from "d3-scale";
import { format } from "d3-format";
import { Box, Grid, Typography } from "@mui/material";

const formatNm = format(".1f");

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
        const label = `${formatNm(v0)}-${formatNm(v1)}`;
        return (
          <Grid key={r} direction="column" item container>
            <Grid item>
              <Typography variant="caption">{label}</Typography>
            </Grid>
            <Grid
              item
              component={Box}
              flexGrow={1}
              sx={{ backgroundColor: color, opacity: r, height }}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default QuartileLegend;
