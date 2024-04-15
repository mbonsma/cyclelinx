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
  Divider,
  Box,
  Typography,
  Collapse,
  Link,
  FormGroup,
} from "@mui/material";
import dynamic from "next/dynamic";
import {
  ScaleQuantile,
  scaleLinear,
  scaleLog,
  scaleOrdinal,
  scaleQuantile,
  scaleSymlog,
} from "d3-scale";
import { format } from "d3-format";
import { schemeDark2, schemeSet2 } from "d3-scale-chromatic";
import { Budget, GroupedScoredDA, ScoreSet } from "@/lib/ts/types";
import { extent } from "d3-array";
import LegendGradient from "@/components/LinearLegend";
import QuartileLegend from "@/components/QuartileLegend";

const MapViewer = dynamic(() => import("./../components/MapViewer"), {
  ssr: false,
});

const formatScale = format(".3f");

export type MetricType = "greenspace" | "recreation" | "food" | "employment";

const METRICS: MetricType[] = [
  "greenspace",
  "recreation",
  "food",
  "employment",
];

export const metricTypeScale = scaleOrdinal(
  METRICS,
  schemeDark2.slice(0, METRICS.length)
);

export type EXISTING_LANE_TYPE =
  | "Sharrows"
  | "Multi-Use Trail"
  | "Cycle Track"
  | "Park Road"
  | "Bike Lane"
  | "Signed Route"
  | "Signed Route (No Pavement Markings)"
  | "Multi-Use Trail";

const existingLaneTypes: EXISTING_LANE_TYPE[] = [
  "Multi-Use Trail",
  "Sharrows",
  "Cycle Track",
  "Park Road",
  "Signed Route",
  "Multi-Use Trail",
  "Bike Lane",
];

export const existingScale = scaleOrdinal(
  existingLaneTypes,
  schemeSet2.slice(0, existingLaneTypes.length)
);

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

type ScaleType = "linear" | "quantile" | "log" | "bin";

const getScale = (scaleType: ScaleType, domain: [number, number]) => {
  const opacityRange = [0.1, 0.75];

  switch (scaleType) {
    /*
      This is an opacity scale, works better than interpolating the color and casting to hex, which it seems that
      leaflet doesn't always handle well.
    */

    case "bin":
      return scaleLinear([0, 1], [0, 0.8]);

    case "log":
      return scaleSymlog(domain, opacityRange);

    case "linear":
      return scaleLinear(domain, opacityRange);

    case "quantile":
      return scaleQuantile(domain, [0.2, 0.4, 0.6, 0.8]);
  }
};

const maybeLog = (scaleType: ScaleType, value: number) =>
  scaleType === "log" ? Math.log10(value) : value;

export default function Home() {
  const [budgetId, setBudgetId] = useState<number>();
  const [budgets, setBudgets] = useState<Budget[]>();
  const [features, setFeatures] = useState<any>();
  const [existingLanes, setExistingLanes] = useState<any>();
  const [measuresVisible, setMeasuresVisible] = useState<any>();
  const [scoreSetType, setScoreSetType] = useState<keyof ScoreSet>("budget");
  const [scaleTypeVisible, setScaleTypeVisible] = useState<any>();
  const [scaleType, setScaleType] = useState<ScaleType>("linear");
  const [scores, setScores] = useState<GroupedScoredDA[]>();
  const [visibleExistingLanes, setVisibleExistingLanes] = useState<
    EXISTING_LANE_TYPE[]
  >([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(METRICS[0]);

  useEffect(() => {
    axios
      .get<Budget[]>("http://localhost:9033/budgets")
      .then((r) => setBudgets(r.data));

    axios
      .get(`http://localhost:9033/existing-lanes`)
      .then((r) => setExistingLanes(r.data));
  }, []);

  const daScale = useMemo(() => {
    if (scores && selectedMetric) {
      const scoreExtent = extent(
        scores.map((s) => s.scores[scoreSetType][selectedMetric])
      ) as [number, number];
      return getScale(scaleType, scoreExtent);
    }
  }, [scores, selectedMetric, scaleType, scoreSetType]);

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
            {daScale && (
              <>
                <Grid item>
                  {["linear", "log"].includes(scaleType) && (
                    <>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          <Typography variant="caption">
                            {formatScale(
                              maybeLog(scaleType, daScale.domain()[0])
                            )}
                          </Typography>
                        </span>
                        <span>
                          <Typography variant="caption">
                            {formatScale(
                              maybeLog(scaleType, daScale.domain()[1])
                            )}
                          </Typography>
                        </span>
                      </Box>

                      <LegendGradient
                        color={metricTypeScale(selectedMetric)}
                        height={5}
                        range={daScale.range() as [number, number]}
                      />
                    </>
                  )}
                  {scaleType == "quantile" && (
                    <QuartileLegend
                      color={metricTypeScale(selectedMetric)}
                      height={7}
                      scale={daScale as ScaleQuantile<number, number>}
                    />
                  )}
                </Grid>
                <Grid item>
                  <Link
                    href="#"
                    onClick={() => setScaleTypeVisible(!scaleTypeVisible)}
                  >
                    <Typography variant="caption">
                      {`${scaleTypeVisible ? "Hide" : "Show"}`} scale types
                    </Typography>
                  </Link>
                  <Collapse in={scaleTypeVisible}>
                    <FormControl fullWidth>
                      <RadioGroup>
                        {(["linear", "quantile", "log"] as ScaleType[]).map(
                          (t) => {
                            return (
                              <FormControlLabel
                                key={t}
                                control={<Radio />}
                                label={t}
                                onChange={() => setScaleType(t)}
                                checked={scaleType == t}
                              />
                            );
                          }
                        )}
                      </RadioGroup>
                    </FormControl>
                  </Collapse>
                </Grid>
                <Grid item>
                  <Link
                    href="#"
                    onClick={() => setMeasuresVisible(!measuresVisible)}
                  >
                    <Typography variant="caption">
                      {`${measuresVisible ? "Hide" : "Show"}`} measures
                    </Typography>
                  </Link>
                  <Collapse in={measuresVisible}>
                    <FormControl fullWidth>
                      <RadioGroup>
                        <FormControlLabel
                          control={<Radio />}
                          label="After Improvement"
                          onChange={() => setScoreSetType("budget")}
                          checked={scoreSetType === "budget"}
                        />
                        <FormControlLabel
                          control={<Radio />}
                          label="Diff"
                          onChange={() => setScoreSetType("diff")}
                          checked={scoreSetType === "diff"}
                        />
                        <FormControlLabel
                          control={<Radio />}
                          label="Binary"
                          onChange={() => setScoreSetType("bin")}
                          checked={scoreSetType === "bin"}
                        />
                      </RadioGroup>
                    </FormControl>
                  </Collapse>
                </Grid>
                <Divider sx={{ margin: 2 }} />
              </>
            )}
            <Grid item>
              {existingLanes && (
                <FormControl fullWidth>
                  <FormLabel id="checkbox-group-legend">
                    Existing Lanes
                  </FormLabel>
                  <FormGroup aria-labelledby="checkbox-group-legend">
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
                  </FormGroup>
                </FormControl>
              )}
            </Grid>
          </Grid>
          <Grid item xs={12} md={10} flexGrow={1}>
            <MapViewer
              daScale={daScale}
              existingLanes={existingLanes}
              features={features}
              scores={scores!}
              scoreSet={scoreSetType}
              selectedMetric={selectedMetric}
              visibleExistingLanes={visibleExistingLanes}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
