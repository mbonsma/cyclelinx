"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Grid, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import dynamic from "next/dynamic";

import { Budget } from "@/lib/ts/types";

const MapViewer = dynamic(() => import("./../components/MapViewer"), {
  ssr: false,
});

export default function Home() {
  const [budgetId, setBudgetId] = useState<number>();
  const [features, setFeatures] = useState<any>();
  const [budgets, setBudgets] = useState<Budget[]>();

  useEffect(() => {
    axios
      .get<Budget[]>("http://localhost:9033/budgets")
      .then((r) => setBudgets(r.data));
  }, []);

  useEffect(() => {
    if (budgetId) {
      axios
        .get(`http://localhost:9033/budgets/${budgetId}/features`)
        .then((r) => setFeatures(r.data));
    }
  }, [budgetId]);

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
                value={budgetId || ""}
                label="Age"
                onChange={(e) => setBudgetId(+e.target.value)}
              >
                {budgets &&
                  budgets.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid width={"100%"} item xs={12} md={10} flexGrow={1}>
            <MapViewer features={features} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
