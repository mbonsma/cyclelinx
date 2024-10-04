"use client";

import dynamic from "next/dynamic";

import React, { useEffect, useMemo, useState } from "react";
import {
  Budget,
  GroupedScoredDA,
  Metric,
  ScoreSet,
  ScaleType,
  ScoreResults,
} from "@/lib/ts/types";
import {
  EXISTING_LANE_NAME_MAP,
  EXISTING_LANE_TYPE,
  existingScale,
  formatDigit,
} from "@/app/page";
import {
  scaleLinear,
  scaleOrdinal,
  ScaleOrdinal,
  ScaleQuantile,
  scaleQuantile,
  scaleSymlog,
} from "d3-scale";
import { schemeDark2 } from "d3-scale-chromatic";
import axios from "axios";
import { extent } from "d3-array";
import {
  Box,
  Checkbox,
  checkboxClasses,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Typography,
  useTheme,
} from "@mui/material";
import {
  LegendGradient,
  QuartileLegend,
  BinaryLegend,
  LoadingOverlay,
} from "@/components";

// we need to import this dynamically b/c leaflet needs `window` and can't be prerendered
const MapViewer = dynamic(() => import("./MapViewer"), {
  ssr: false,
});

interface ViewPanelProps {
  budgets: Budget[];
  existingLanes: any[];
  metrics: Metric[];
}

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

const ViewPanel: React.FC<ViewPanelProps> = ({
  budgets,
  existingLanes,
  metrics,
}) => {
  const [budgetId, setBudgetId] = useState<number>();
  const [features, setFeatures] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [measuresVisible, setMeasuresVisible] = useState<any>();
  const [scaleTypeVisible, setScaleTypeVisible] = useState<any>();
  const [scores, setScores] = useState<ScoreResults>();
  const [scoreSetType, setScoreSetType] = useState<keyof ScoreSet>("diff");
  const [scaleType, setScaleType] = useState<ScaleType>("linear");

  const [selectedMetric, setSelectedMetric] = useState<string>();
  const [visibleExistingLanes, setVisibleExistingLanes] = useState<
    EXISTING_LANE_TYPE[]
  >([]);

  const theme = useTheme();

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
    if (budgetId) {
      setLoading(true);

      const promises = [
        axios.get(`http://localhost:9033/budgets/${budgetId}/features`), // 0
        axios.get<ScoreResults>(
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

  const scoreScale = useMemo(() => {
    if (scores && selectedMetric) {
      const scoreExtent = extent(
        Object.values(scores).map((s) => s.scores[scoreSetType][selectedMetric])
      ) as [number, number];
      return getScale(scaleType, scoreExtent);
    }
  }, [scores, selectedMetric, scaleType, scoreSetType]);

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
            <InputLabel id="budget-select-label">Budget (in km)</InputLabel>
            <Select
              labelId="budget-select-label"
              id="budget-select"
              value={budgetId || ""}
              label="Budget (in km)"
              onChange={(e) => setBudgetId(+e.target.value)}
            >
              {budgets &&
                budgets
                  .sort((a, b) => (+a.name < +b.name ? -1 : 1))
                  .map((b) => ({ ["km"]: Number(b.name) / 4, ...b }))
                  .map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.km}
                    </MenuItem>
                  ))}
            </Select>
          </FormControl>
        </Grid>
        {!!budgetId && (
          <Grid item container spacing={3} alignItems="center" direction="row">
            <Grid item flexGrow={1}>
              <Box
                style={{
                  backgroundColor: theme.palette.projectColor,
                  height: "5px",
                }}
              />
            </Grid>
            <Grid item>Proposed New Bike Lane</Grid>
          </Grid>
        )}
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
        {scoreScale && (
          <Grid item container>
            {["linear", "log"].includes(scaleType) && (
              <>
                <Grid item container justifyContent="space-between">
                  <span>
                    <Typography variant="caption">
                      {formatDigit(maybeLog(scaleType, scoreScale.domain()[0]))}
                    </Typography>
                  </span>
                  <span>
                    <Typography variant="caption">
                      {formatDigit(maybeLog(scaleType, scoreScale.domain()[1]))}
                    </Typography>
                  </span>
                </Grid>
                {!!selectedMetric && !!metricTypeScale && (
                  <Grid item width="100%">
                    <LegendGradient
                      color={metricTypeScale(selectedMetric)}
                      height={7}
                      range={scoreScale.range() as [number, number]}
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
                  scale={scoreScale as ScaleQuantile<number, number>}
                />
              )}

            {!!selectedMetric && scaleType == "bin" && !!metricTypeScale && (
              <BinaryLegend
                label="Greenspace Access"
                color={metricTypeScale(selectedMetric)}
                height={7}
              />
            )}
          </Grid>
        )}

        {!!scoreScale && selectedMetric !== "greenspace" && (
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
                  {(["linear", "log", "quantile"] as ScaleType[]).map((t) => {
                    return (
                      <FormControlLabel
                        key={t}
                        control={<Radio />}
                        label={t}
                        onChange={() => setScaleType(t)}
                        checked={scaleType == t}
                      />
                    );
                  })}
                </RadioGroup>
              </FormControl>
            </Collapse>
          </Grid>
        )}
        {!!scoreScale && (
          <Grid item>
            <Link href="#" onClick={() => setMeasuresVisible(!measuresVisible)}>
              <Typography variant="caption">
                {`${measuresVisible ? "Hide" : "Show"}`} measures
              </Typography>
            </Link>
            <Collapse in={measuresVisible}>
              <FormControl fullWidth>
                <RadioGroup>
                  <FormControlLabel
                    control={<Radio />}
                    label="Change over Present"
                    onChange={() => setScoreSetType("diff")}
                    checked={scoreSetType === "diff"}
                  />
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
                </RadioGroup>
              </FormControl>
            </Collapse>
          </Grid>
        )}
        <Divider sx={{ margin: 2 }} />
        <Grid item>
          {existingLanes && (
            <FormControl fullWidth>
              <FormLabel id="checkbox-group-legend">Existing Lanes</FormLabel>
              <FormGroup aria-labelledby="checkbox-group-legend">
                {Array.from(new Set(Object.values(EXISTING_LANE_NAME_MAP))).map(
                  (m: EXISTING_LANE_TYPE) => (
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
                  )
                )}
              </FormGroup>
            </FormControl>
          )}
        </Grid>
      </Grid>
      <Grid item xs={12} md={10} flexGrow={1}>
        {!!metricTypeScale && (
          <MapViewer
            scoreScale={scoreScale}
            existingLanes={existingLanes}
            features={features}
            scores={scores}
            scoreSet={scoreSetType}
            selectedMetric={selectedMetric}
            visibleExistingLanes={visibleExistingLanes}
            metricTypeScale={metricTypeScale}
          />
        )}
      </Grid>
      <LoadingOverlay open={loading} />
    </Grid>
  );
};

export default ViewPanel;
