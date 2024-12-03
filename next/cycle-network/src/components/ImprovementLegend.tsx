import React from "react";
import { Button, Grid, Typography, useTheme } from "@mui/material";
import LaneChangeLegend from "./LaneChangeLegend";
import { formatNumber } from "@/lib/ts/util";
import { PendingImprovements } from "@/lib/ts/types";

interface ImprovementLegendProps {
  handleCalculation: () => void;
  improvements?: number[];
  pendingImprovements: PendingImprovements;
  reset: () => void;
  totalKm?: number;
}

const ImprovementLegend: React.FC<ImprovementLegendProps> = ({
  handleCalculation,
  improvements,
  pendingImprovements,
  reset,
  totalKm,
}) => {
  const theme = useTheme();

  return (
    <>
      {!!improvements && (
        <LaneChangeLegend
          color={theme.palette.projectColor}
          label="Proposed New Bike Lane"
        />
      )}
      {!!pendingImprovements.toAdd.length && (
        <LaneChangeLegend
          color={theme.palette.projectAddColor}
          label="Pending New Bike Lane"
        />
      )}
      {!!pendingImprovements.toRemove.length && (
        <LaneChangeLegend
          color={theme.palette.projectRemoveColor}
          label="Pending Removal of Proposed Lane"
        />
      )}
      {(!!pendingImprovements.toRemove.length ||
        !!pendingImprovements.toAdd.length) && (
        <Grid item>
          <Button onClick={handleCalculation} variant="outlined">
            Calculate New Scores
          </Button>
        </Grid>
      )}
      {!!improvements && (
        <Grid item>
          <Button onClick={reset} variant="outlined">
            Reset
          </Button>
        </Grid>
      )}
      {!!totalKm && (
        <Grid item>
          <Typography variant="caption">
            Total New Bike Lanes: {formatNumber(totalKm / 1000)} (in KM)
          </Typography>
        </Grid>
      )}
    </>
  );
};

export default ImprovementLegend;
