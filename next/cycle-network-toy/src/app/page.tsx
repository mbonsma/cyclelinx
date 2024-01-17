"use client";

import React, { useState } from "react";
import { Grid, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import dynamic from "next/dynamic";

import { BUDGET_MAP } from "./../components/MapViewer";

const MapViewer = dynamic(() => import("./../components/MapViewer"), {
  ssr: false,
});

export default function Home() {
  const [budget, setBudget] = useState<keyof typeof BUDGET_MAP>(40);

  const budgets = Array(12)
    .fill(null)
    .map((_, i) => (i + 1) * 40);

  return (
    /* Outer container */
    <Grid direction="row" container justifyContent="center">
      {/* Inner column container */}
      <Grid
        alignItems="center"
        spacing={5}
        container
        flexGrow={1}
        item
        maxWidth={1096}
        direction="column"
      >
        <Grid
          marginTop={"10px"}
          item
          container
          direction="row"
          spacing={3}
          flexGrow={1}
        >
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel id="budget-select-label">Budget</InputLabel>
              <Select
                labelId="budget-select-label"
                id="budget-select"
                value={budget}
                label="Age"
                onChange={(e) =>
                  setBudget(+e.target.value as keyof typeof BUDGET_MAP)
                }
              >
                {budgets.map((b) => (
                  <MenuItem key={b} value={b}>
                    {b}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid width={"100%"} item xs={12} md={10} flexGrow={1}>
            <MapViewer budget={budget} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
