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
  Typography,
  Collapse,
  Link,
  FormGroup,
} from "@mui/material";
import dynamic from "next/dynamic";
import {
  ScaleOrdinal,
  ScaleQuantile,
  scaleLinear,
  scaleOrdinal,
  scaleQuantile,
  scaleSymlog,
} from "d3-scale";
import { format } from "d3-format";
import { schemeDark2, schemeSet2 } from "d3-scale-chromatic";
import { Budget, GroupedScoredDA, Metric, ScoreSet } from "@/lib/ts/types";
import { extent } from "d3-array";
import LegendGradient from "@/components/LinearLegend";
import QuartileLegend from "@/components/QuartileLegend";
import BinaryLegend from "@/components/BinaryLegend";
import LoadingOverlay from "@/components/LoadingOverlay";

const MapViewer = dynamic(() => import("./../components/MapViewer"), {
  ssr: false,
});

/**
 * Round number and return
 *
 * @param {number} value
 * @param {number} sd significant digits
 * @returns {number}
 */
export const roundDigit = (value: number, sd?: number): number => {
  let fmt = "";
  if (!value) {
    return value;
  } else if (sd) {
    fmt = `.${sd}~r`;
  } else if (sd === undefined) {
    //for smaller numbers, use 3 sig digits, stripping trailing zeroes
    if (Math.abs(value) < 10) {
      fmt = `.3~r`;
      //for larger, round to 2 decimal places, stripping trailing zeroes
    } else {
      fmt = `.2~f`;
    }
  }
  let res: number;
  try {
    //for negative numbers, replace d3's dash with javascript's hyphen
    res = +format(fmt)(value).replace("−", "-");
    return res;
  } catch (e) {
    //we don't want the app to blow up if this function can't handle something
    //eslint-disable-next-line no-console
    console.error(e);
    return value;
  }
};

/**
 * Convert number to string, adding commas to numbers greater than a thousand,
 *     otherwise use decimal notation, varying significant digits by size
 *
 * @param {number} value
 * @returns {string}
 */
export const formatDigit = (value: number, d?: number) => {
  const rounded = roundDigit(value, d);
  if (rounded > 1000) {
    return format(",d")(rounded);
  } else return rounded;
};

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
  const [loading, setLoading] = useState(false);
  const [measuresVisible, setMeasuresVisible] = useState<any>();
  const [metrics, setMetrics] = useState<Metric[]>();
  const [scoreSetType, setScoreSetType] = useState<keyof ScoreSet>("budget");
  const [scaleTypeVisible, setScaleTypeVisible] = useState<any>();
  const [scaleType, setScaleType] = useState<ScaleType>("linear");
  const [scores, setScores] = useState<GroupedScoredDA[]>();
  const [visibleExistingLanes, setVisibleExistingLanes] = useState<
    EXISTING_LANE_TYPE[]
  >([]);
  const [selectedMetric, setSelectedMetric] = useState<string>();

  const metricTypeScale: ScaleOrdinal<string, string, never> | undefined =
    useMemo(() => {
      if (metrics) {
        const scale = scaleOrdinal(
          metrics.map((r) => r.name),
          schemeDark2.slice(0, metrics.length)
        );
        return scale;
      } else {
        return undefined;
      }
    }, [metrics]);

  useEffect(() => {
    setLoading(true);

    const promises = [
      axios.get<Budget[]>("http://localhost:9033/budgets"), // 0
      axios.get(`http://localhost:9033/existing-lanes`), // 1
      axios.get<Metric[]>(`http://localhost:9033/metrics`), // 2
    ];

    Promise.allSettled(promises)
      .then((results) =>
        results.forEach((result, i) => {
          switch (i) {
            case 0:
              if (result.status === "fulfilled") {
                setBudgets(result.value.data);
              }
            case 1:
              if (result.status === "fulfilled") {
                setExistingLanes(result.value.data);
              }
            case 2:
              if (result.status === "fulfilled") {
                setMetrics(result.value.data);
              }
          }
        })
      )
      .finally(() => setLoading(false));
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
      setLoading(true);

      const promises = [
        axios.get(`http://localhost:9033/budgets/${budgetId}/features`), // 0
        axios.get<GroupedScoredDA[]>(
          `http://localhost:9033/budgets/${budgetId}/scores` // 1
        ),
      ];

      Promise.allSettled(promises)
        .then((results) =>
          results.forEach((result, i) => {
            switch (i) {
              case 0:
                if (result.status === "fulfilled") {
                  setFeatures(result.value.data);
                }
              case 1:
                if (result.status === "fulfilled") {
                  setScores(result.value.data);
                }
            }
          })
        )
        .finally(() => setLoading(false));
    }
  }, [budgetId]);

  const setMetric = (metric: string) => {
    //for greenspace, we will automatically use binary, but binary cannot be used for other metrics
    setSelectedMetric(metric);
    if (metric !== "greenspace" && scaleType === "bin") {
      setScaleType("linear");
      setScoreSetType("budget");
    } else if (metric === "greenspace") {
      setScaleType("bin");
      setScoreSetType("bin");
    }
  };

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
              {!!budgetId && !!metrics && (
                <FormControl fullWidth>
                  <FormLabel id="radio-group-legend">Metric</FormLabel>
                  <RadioGroup
                    aria-labelledby="radio-group-legend"
                    defaultValue={metrics[0]}
                    name="radio-buttons-group"
                  >
                    {metrics.map((m) => (
                      <FormControlLabel
                        key={m.id}
                        control={<Radio />}
                        onChange={() => setMetric(m.name)}
                        label={m.name}
                        value={m.name}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
            </Grid>
            {daScale && (
              <Grid item container>
                {["linear", "log"].includes(scaleType) && (
                  <>
                    <Grid item container justifyContent="space-between">
                      <span>
                        <Typography variant="caption">
                          {formatDigit(
                            maybeLog(scaleType, daScale.domain()[0])
                          )}
                        </Typography>
                      </span>
                      <span>
                        <Typography variant="caption">
                          {formatDigit(
                            maybeLog(scaleType, daScale.domain()[1])
                          )}
                        </Typography>
                      </span>
                    </Grid>
                    {!!selectedMetric && !!metricTypeScale && (
                      <Grid item width="100%">
                        <LegendGradient
                          color={metricTypeScale(selectedMetric)}
                          height={7}
                          range={daScale.range() as [number, number]}
                        />
                      </Grid>
                    )}
                  </>
                )}

                {!!selectedMetric &&
                  scaleType == "quantile" &&
                  !!metricTypeScale && (
                    <QuartileLegend
                      color={metricTypeScale(selectedMetric)}
                      height={7}
                      scale={daScale as ScaleQuantile<number, number>}
                    />
                  )}

                {!!selectedMetric &&
                  scaleType == "bin" &&
                  !!metricTypeScale && (
                    <BinaryLegend
                      label="Greenspace Access"
                      color={metricTypeScale(selectedMetric)}
                      height={7}
                    />
                  )}
              </Grid>
            )}

            {!!daScale && selectedMetric !== "greenspace" && (
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
                      {(["linear", "log", "quantile"] as ScaleType[]).map(
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
            )}
            {!!daScale && (
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
                      {selectedMetric !== "greenspace" && (
                        <FormControlLabel
                          control={<Radio />}
                          label="Projected Total"
                          onChange={() => setScoreSetType("budget")}
                          checked={scoreSetType === "budget"}
                        />
                      )}
                      {selectedMetric == "greenspace" && (
                        <FormControlLabel
                          control={<Radio />}
                          label="Projected Total"
                          onChange={() => setScoreSetType("bin")}
                          checked={scoreSetType === "bin"}
                        />
                      )}
                      <FormControlLabel
                        control={<Radio />}
                        label="Change over Present"
                        onChange={() => setScoreSetType("diff")}
                        checked={scoreSetType === "diff"}
                      />
                    </RadioGroup>
                  </FormControl>
                </Collapse>
              </Grid>
            )}
            <Divider sx={{ margin: 2 }} />
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
            {!!metricTypeScale && (
              <MapViewer
                daScale={daScale}
                existingLanes={existingLanes}
                features={features}
                scores={scores!}
                scoreSet={scoreSetType}
                selectedMetric={selectedMetric}
                visibleExistingLanes={visibleExistingLanes}
                metricTypeScale={metricTypeScale}
              />
            )}
          </Grid>
        </Grid>
      </Grid>
      <LoadingOverlay open={loading} />
    </Grid>
  );
}
