"use client";

import dynamic from "next/dynamic";

import React, { useEffect, useMemo, useState } from "react";
import {
  Budget,
  Metric,
  ScoreSet,
  ScaleType,
  ScoreResults,
  BudgetProjectMember,
  PendingImprovements,
  EXISTING_LANE_TYPE,
  HistoryItem,
} from "@/lib/ts/types";
import {
  scaleLinear,
  scaleOrdinal,
  ScaleOrdinal,
  ScaleQuantile,
  scaleQuantile,
  scaleSymlog,
} from "d3-scale";
import { schemeDark2 } from "d3-scale-chromatic";
import { extent } from "d3-array";
import {
  Button,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import difference from "set.prototype.difference";
import union from "set.prototype.union";
import {
  LegendGradient,
  QuartileLegend,
  BinaryLegend,
  LoadingOverlay,
  ImprovementLegend,
  MetricSelector,
  ScoreScalePanel,
  ExistingLaneControls,
  ScoreScaleSelector,
  WelcomeOverlay,
  CollapsibleSection,
  HistoryModal,
  HistoryPanel,
} from "@/components";
import {
  fetchBudgetScores,
  fetchImprovements,
  fetchNewCalculations,
} from "@/lib/axios/api";
import { formatDigit } from "@/lib/ts/util";

// we need to import this dynamically b/c leaflet needs `window` and can't be prerendered
const MapViewer = dynamic(() => import("./MapViewer"), {
  ssr: false,
});

interface MainViewPanelProps {
  budgets: Budget[];
  metrics: Metric[];
}

const getScale = (scaleType: ScaleType, domain: [number, number]) => {
  const opacityRange = [0, 0.75];

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

const MainViewPanel: React.FC<MainViewPanelProps> = ({ budgets, metrics }) => {
  const [budgetId, setBudgetId] = useState<number>();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [improvements, setImprovements] = useState<number[]>();
  const [loading, setLoading] = useState(false);
  const [measuresVisible, setMeasuresVisible] = useState(false);
  const [pendingImprovements, setPendingImprovements] =
    useState<PendingImprovements>({
      toAdd: [],
      toRemove: [],
    });
  const [scaleTypeVisible, setScaleTypeVisible] = useState(false);
  const [scores, setScores] = useState<ScoreResults>();
  const [scoreSetType, setScoreSetType] = useState<keyof ScoreSet>("diff");
  const [scaleType, setScaleType] = useState<ScaleType>("linear");
  const [selectedMetric, setSelectedMetric] = useState("");
  const [totalKm, setTotalKm] = useState<number>();
  const [visibleExistingLanes, setVisibleExistingLanes] = useState<
    EXISTING_LANE_TYPE[]
  >([]);
  const [welcomeOverlayVisible, setWelcomeOverlayVisible] = useState(true);

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
        fetchImprovements(budgetId), // 0
        fetchBudgetScores(budgetId), // 1
      ];

      Promise.allSettled(promises)
        .then((results) =>
          results.forEach((result, i) => {
            switch (i) {
              case 0:
                if (
                  result.status === "fulfilled" &&
                  Array.isArray(result.value.data)
                ) {
                  const improvements = result.value
                    .data as BudgetProjectMember[];
                  setImprovements(improvements.map((i) => i.project_id));
                  // setTotalKm(
                  //   improvements.features.reduce(
                  //     (acc, curr) => (acc += curr.properties.total_length),
                  //     0
                  //   )
                  // );
                }
              case 1:
                if (result.status === "fulfilled") {
                  setScores(result.value.data as ScoreResults);
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

  const handleCalculation = async () => {
    const improvementsSet = new Set(improvements);
    const toAddSet = new Set(pendingImprovements.toAdd);
    const toRemoveSet = new Set(pendingImprovements.toRemove);

    const projectIds = [
      ...union(difference(improvementsSet, toRemoveSet), toAddSet),
    ];

    try {
      setLoading(true);
      const scores = await fetchNewCalculations(projectIds);
      setScores(scores.data);
      setImprovements(projectIds);
      setPendingImprovements({
        toAdd: [],
        toRemove: [],
      });
      setBudgetId(undefined);
    } finally {
      setLoading(false);
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
        <ImprovementLegend
          handleCalculation={handleCalculation}
          improvements={improvements}
          pendingImprovements={pendingImprovements}
          totalKm={totalKm}
        />
        <Grid item container>
          {!!improvements && (
            <CollapsibleSection label="Metrics" defaultOpen={true}>
              <Grid item container spacing={2}>
                <Grid
                  item
                  container
                  alignItems="center"
                  wrap="nowrap"
                  spacing={2}
                  justifyContent="space-between"
                >
                  <Grid item xs={8}>
                    <Typography>10% improvement over baseline</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Button onClick={() => setHistoryModalOpen(true)}>
                      Save
                    </Button>
                  </Grid>
                </Grid>
                <Grid item>
                  <MetricSelector
                    metrics={metrics}
                    setMetric={setMetric}
                    selectedMetric={selectedMetric}
                  />
                </Grid>
                {!!scoreScale && (
                  <Grid item container>
                    {["linear", "log"].includes(scaleType) && (
                      <>
                        <Grid item container justifyContent="space-between">
                          <span>
                            <Typography variant="caption">
                              {formatDigit(
                                maybeLog(scaleType, scoreScale.domain()[0])
                              )}
                            </Typography>
                          </span>
                          <span>
                            <Typography variant="caption">
                              {formatDigit(
                                maybeLog(scaleType, scoreScale.domain()[1])
                              )}
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
                {!!scoreScale && selectedMetric !== "greenspace" && (
                  <Grid item>
                    <ScoreScaleSelector
                      scaleType={scaleType}
                      scaleTypeVisible={scaleTypeVisible}
                      setScaleType={setScaleType}
                      setScaleTypeVisible={setScaleTypeVisible}
                    />
                  </Grid>
                )}
                {!!scoreScale && (
                  <Grid item>
                    <ScoreScalePanel
                      measuresVisible={measuresVisible}
                      scoreScale={scoreScale}
                      scoreSetType={scoreSetType}
                      selectedMetric={selectedMetric}
                      setMeasuresVisible={setMeasuresVisible}
                      setScoreSetType={setScoreSetType}
                    />
                  </Grid>
                )}
              </Grid>
            </CollapsibleSection>
          )}
        </Grid>
        <Divider sx={{ margin: 2 }} />
        <Grid item>
          <CollapsibleSection defaultOpen label="Existing Lanes">
            <ExistingLaneControls
              setVisibleExistingLanes={setVisibleExistingLanes}
              visibleExistingLanes={visibleExistingLanes}
            />
          </CollapsibleSection>
        </Grid>
        <Divider sx={{ margin: 2 }} />
        <Grid item>
          {!!history.length && (
            <CollapsibleSection label="History" defaultOpen={true}>
              <HistoryPanel
                history={history}
                setBaseline={(scores: ScoreResults) => scores}
                //TODO: use useCallback
                updateView={(item: HistoryItem) => {
                  setImprovements(item.improvements);
                  setScores(item.scores);
                }}
              />
            </CollapsibleSection>
          )}
        </Grid>
      </Grid>
      <Grid item xs={12} md={10} flexGrow={1}>
        {!!metricTypeScale && (
          <MapViewer
            improvements={improvements}
            pendingImprovements={pendingImprovements}
            metricTypeScale={metricTypeScale}
            setPendingImprovements={setPendingImprovements}
            scores={scores}
            scoreScale={scoreScale}
            scoreSet={scoreSetType}
            selectedMetric={selectedMetric}
            visibleExistingLanes={visibleExistingLanes}
          />
        )}
      </Grid>
      <WelcomeOverlay
        open={welcomeOverlayVisible}
        onClose={() => setWelcomeOverlayVisible(false)}
      />
      <LoadingOverlay open={loading} />
      <HistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        onSave={(name: string) =>
          //TODO: once this is finalized, use useCallback
          !!scores &&
          !!improvements &&
          setHistory((history) =>
            history.concat({
              improvements,
              name,
              scores,
            })
          )
        }
      />
    </Grid>
  );
};

export default MainViewPanel;
