"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
} from "@mui/material";
import dynamic from "next/dynamic";
import { scaleLinear, scaleOrdinal } from "d3-scale";

import { Budget } from "@/lib/ts/types";

const MapViewer = dynamic(() => import("./../components/MapViewer"), {
  ssr: false,
});

const METRICS = ["recreation", "food", "employment"];
const SCORE_RANGE = [1, 10];

const metricScale = scaleOrdinal(METRICS, ["red", "green", "blue"]);
const opacityScale = scaleLinear(SCORE_RANGE, [0.1, 0.75]);

export default function Home() {
  const [budgetId, setBudgetId] = useState<number>();
  const [budgets, setBudgets] = useState<Budget[]>();
  const [features, setFeatures] = useState<any>();
  const [scores, setScores] = useState<any>();
  const [selectedMetric, setSelectedMetric] = useState<string>();

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

      axios
        .get(`http://localhost:9033/budgets/${budgetId}/scores`)
        .then((r) => setScores(r.data));
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
        // maxWidth={1096}
        direction="column"
      >
        <Grid
          item
          container
          direction="row"
          flexWrap="nowrap"
          spacing={3}
          flexGrow={1}
        >
          <Grid
            item
            spacing={2}
            marginLeft={2}
            marginTop={2}
            container
            direction="column"
            xs={12}
            md={2}
          >
            <Grid item>
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
            <Grid item>
              {!!budgetId && (
                <FormControl fullWidth>
                  <FormLabel id="radio-group-legend">Metric</FormLabel>
                  <RadioGroup
                    aria-labelledby="radio-group-legend"
                    defaultValue={METRICS[0]}
                    name="radio-buttons-group"
                  >
                    {METRICS.map((m) => (
                      <FormControlLabel
                        key={m}
                        value={m}
                        control={<Radio />}
                        onChange={() => setSelectedMetric(m)}
                        label={m}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
            </Grid>
          </Grid>
          <Grid item xs={12} md={10} flexGrow={1}>
            <MapViewer
              metricScale={metricScale}
              opacityScale={opacityScale}
              features={features}
              scores={scores}
              selectedMetric={selectedMetric}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
