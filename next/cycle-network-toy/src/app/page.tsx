"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Checkbox,
  checkboxClasses,
} from "@mui/material";
import dynamic from "next/dynamic";
import { scaleOrdinal } from "d3-scale";
import { Budget, GroupedScoredDA } from "@/lib/ts/types";

const MapViewer = dynamic(() => import("./../components/MapViewer"), {
  ssr: false,
});

const METRICS = ["recreation", "food", "employment"];

export const metricScale = scaleOrdinal(METRICS, ["red", "green", "blue"]);

const existingLaneTypes: EXISTING_LANE_TYPE[] = [
  "Multi-Use Trail",
  "Sharrows",
  "Cycle Track",
  "Park Road",
  "Signed Route",
  "Multi-Use Trail",
  "Bike Lane",
];

export const existingScale = scaleOrdinal(existingLaneTypes, [
  "orange",
  "brown",
  "pink",
  "purple",
  "teal",
  "magenta",
  "yellow",
]);

export type EXISTING_LANE_TYPE =
  | "Sharrows"
  | "Multi-Use Trail"
  | "Cycle Track"
  | "Park Road"
  | "Bike Lane"
  | "Signed Route"
  | "Signed Route (No Pavement Markings)"
  | "Multi-Use Trail";

export const EXISTING_LANE_NAME_MAP: Record<string, EXISTING_LANE_TYPE> = {
  ["Sharrows - Wayfinding"]: "Sharrows",
  ["Multi-Use Trail"]: "Multi-Use Trail",
  ["Multi-Use Trail - Entrance"]: "Multi-Use Trail",
  ["Cycle Track"]: "Cycle Track",
  ["Park Road"]: "Park Road",
  ["Sharrows"]: "Sharrows",
  ["Bike Lane"]: "Bike Lane",
  ["Bi-Directional Cycle Track"]: "Cycle Track",
  ["Signed Route (No Pavement Markings)"]:
    "Signed Route (No Pavement Markings)",
  ["Bike Lane - Buffered"]: "Bike Lane",
  ["Multi-Use Trail - Connector"]: "Multi-Use Trail",
  ["Multi-Use Trail - Boulevard"]: "Multi-Use Trail",
  ["Multi-Use Trail - Existing Connector"]: "Multi-Use Trail",
  ["Bike Lane - Contraflow"]: "Bike Lane",
  ["Sharrows - Arterial"]: "Sharrows",
  ["Sharrows - Arterial - Connector"]: "Sharrows",
  ["Cycle Track - Contraflow"]: "Cycle Track",
};

export default function Home() {
  const [budgetId, setBudgetId] = useState<number>();
  const [budgets, setBudgets] = useState<Budget[]>();
  const [features, setFeatures] = useState<any>();
  const [existingLanes, setExistingLanes] = useState<any>();
  const [scores, setScores] = useState<GroupedScoredDA[]>();
  const [visibleExistingLanes, setVisibleExistingLanes] = useState<
    EXISTING_LANE_TYPE[]
  >([]);
  const [selectedMetric, setSelectedMetric] = useState<string>(METRICS[0]);

  useEffect(() => {
    axios
      .get<Budget[]>("http://localhost:9033/budgets")
      .then((r) => setBudgets(r.data));

    axios
      .get(`http://localhost:9033/existing-lanes`)
      .then((r) => setExistingLanes(r.data));
  }, []);

  useEffect(() => {
    if (budgetId) {
      axios
        .get(`http://localhost:9033/budgets/${budgetId}/features`)
        .then((r) => setFeatures(r.data));

      axios
        .get<GroupedScoredDA[]>(
          `http://localhost:9033/budgets/${budgetId}/scores`
        )
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
                    budgets
                      .sort((a, b) => (+a.name < +b.name ? -1 : 1))
                      .map((b) => (
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
                        control={<Radio />}
                        onChange={() => setSelectedMetric(m)}
                        label={m}
                        value={m}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
            </Grid>
            <Grid item>
              {existingLanes && (
                <FormControl fullWidth>
                  <FormLabel id="checkbox-group-legend">
                    Existing Lanes
                  </FormLabel>
                  <RadioGroup
                    aria-labelledby="checkbox-group-legend"
                    name="checkbox-group"
                  >
                    {Array.from(
                      new Set(Object.values(EXISTING_LANE_NAME_MAP))
                    ).map((m: EXISTING_LANE_TYPE) => (
                      <FormControlLabel
                        key={m}
                        control={
                          <Checkbox
                            sx={{
                              [`&, &.${checkboxClasses.checked}`]: {
                                color: existingScale(m),
                              },
                            }}
                          />
                        }
                        onChange={() =>
                          visibleExistingLanes.includes(m)
                            ? setVisibleExistingLanes(
                                visibleExistingLanes.filter((l) => l !== m)
                              )
                            : setVisibleExistingLanes(
                                visibleExistingLanes.concat(m)
                              )
                        }
                        label={m}
                        value={m}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
            </Grid>
          </Grid>
          <Grid item xs={12} md={10} flexGrow={1}>
            <MapViewer
              existingLanes={existingLanes}
              features={features}
              scores={scores!}
              selectedMetric={selectedMetric}
              visibleExistingLanes={visibleExistingLanes}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
