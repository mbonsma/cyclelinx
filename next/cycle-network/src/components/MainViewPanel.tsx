"use client";

import dynamic from "next/dynamic";

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  DefaultScores,
  ArterialFeatureGeoJSONExport,
  ArterialFeaturePropertiesExport,
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
  Box,
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
import { downloadGeojson, formatNumber } from "@/lib/ts/util";
import { StaticDataContext } from "@/providers/StaticDataProvider";
import intersection from "set.prototype.intersection";

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

interface SummaryStat {
  baselineAvg: number;
  avg: number;
}

interface SummaryStats {
  [metric: string]: SummaryStat;
}

interface Total {
  [metric: string]: { baseline: number; current: number };
}

class SummaryStatBuilder {
  private daCount: number;
  private stats: SummaryStats;
  private totals: Total;
  private metrics: Set<string>;

  constructor(daCount: number) {
    this.daCount = daCount;
    this.metrics = new Set();
    this.stats = {};
    this.totals = {};
  }

  add = (metric: string, type: "current" | "baseline", val: number) => {
    this.metrics.add(metric);
    if (this.totals[metric]) {
      this.totals[metric][type] += val;
    } else {
      this.totals[metric] = { baseline: 0, current: 0 };
      this.add(metric, type, val);
    }
  };

  calculate = (baseline?: SummaryStats) => {
    [...this.metrics].forEach((m) => {
      this.stats[m] = {
        avg: 0,
        baselineAvg: 0,
      };
      this.stats[m].avg = this.totals[m].current / this.daCount;
      this.stats[m].baselineAvg = baseline
        ? baseline[m].avg
        : this.totals[m].baseline / this.daCount;
    });

    return this.stats;
  };
}

const calculateDefaultBaselineSummaryStats = (scores: DefaultScores) => {
  const Builder = new SummaryStatBuilder(Object.values(scores).length);
  Object.values(scores).forEach((scores) => {
    for (const metric in scores) {
      if (metric !== "da") {
        //we're not interested in the baseline's baseline, so it can identical
        Builder.add(metric, "current", scores[metric]);
        Builder.add(metric, "baseline", scores[metric]);
      }
    }
  });
  return Builder.calculate();
};

const calculateSummaryStats = (
  scores: ScoreResults,
  daCount: number,
  baseline?: SummaryStats
) => {
  const Builder = new SummaryStatBuilder(daCount);

  Object.values(scores).forEach(({ scores }) => {
    for (const metric in scores.budget) {
      Builder.add(metric, "current", scores.budget[metric]);
    }
  });

  if (!baseline) {
    Object.values(scores).forEach(({ scores }) => {
      for (const metric in scores.original) {
        Builder.add(metric, "baseline", scores.original[metric]);
      }
    });
  }

  return Builder.calculate(baseline);
};

const MainViewPanel: React.FC<MainViewPanelProps> = ({ budgets, metrics }) => {
  const [activeHistory, setActiveHistory] = useState<string>("");
  const [baseline, setBaseline] = useState<SummaryStats>();
  const [budgetId, setBudgetId] = useState<number>();
  const [calculating, setCalculating] = useState(false);
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
  const [summaryStats, setSummaryStats] = useState<SummaryStats>();
  const [totalKm, setTotalKm] = useState<number>();
  const [visibleExistingLanes, setVisibleExistingLanes] = useState<
    EXISTING_LANE_TYPE[]
  >([]);
  const [welcomeOverlayVisible, setWelcomeOverlayVisible] = useState(true);

  const { defaultScores, arterials } = useContext(StaticDataContext);

  useEffect(() => {
    if (defaultScores) {
      setBaseline(calculateDefaultBaselineSummaryStats(defaultScores));
    }
  }, [defaultScores]);

  const daCount = useMemo(() => {
    if (defaultScores) {
      return Object.values(defaultScores).length;
    }
  }, [defaultScores]);

  const restoreHistory = useCallback(
    (item: HistoryItem) => {
      if (daCount) {
        setImprovements(item.improvements);
        setScores(item.scores);
        setBudgetId(undefined);
        setActiveHistory(item.name);
        setPendingImprovements({ toAdd: [], toRemove: [] });
      }
    },
    [
      daCount,
      baseline,
      setBudgetId,
      setSummaryStats,
      setBudgetId,
      setScaleType,
      setImprovements,
    ]
  );

  useEffect(() => {
    if (baseline && daCount && scores) {
      setSummaryStats(calculateSummaryStats(scores, daCount, baseline));
    }
  }, [scores, daCount, baseline]);

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

  // User selects a budget
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
            if (i == 0) {
              if (
                result.status === "fulfilled" &&
                Array.isArray(result.value.data)
              ) {
                const improvements = result.value.data as BudgetProjectMember[];
                setImprovements(improvements.map((i) => i.project_id));

                // setTotalKm(
                //   improvements.features.reduce(
                //     (acc, curr) => (acc += curr.properties.total_length),
                //     0
                //   )
                // );
              }
            } else {
              if (result.status === "fulfilled") {
                setScores(result.value.data as ScoreResults);
                if (!selectedMetric) {
                  setSelectedMetric(metrics[0].name);
                }
              }
            }
          })
        )
        .finally(() => setLoading(false));
    }
  }, [budgetId]);

  //TODO: baseline is ALWAYS null unless manually set, at which case it's always that.

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

  const reset = () => {
    setScores(undefined);
    setImprovements(undefined);
    setPendingImprovements({
      toAdd: [],
      toRemove: [],
    });
    setHistory([]);
    setActiveHistory("");
    setBudgetId(undefined);
    setSelectedMetric("");
  };

  const handleCalculation = async () => {
    const improvementsSet = new Set(improvements);
    const toAddSet = new Set(pendingImprovements.toAdd);
    const toRemoveSet = new Set(pendingImprovements.toRemove);

    const projectIds = [
      ...union(difference(improvementsSet, toRemoveSet), toAddSet),
    ];

    if (projectIds.length === 0) {
      return reset();
    }

    try {
      setCalculating(true);
      const scores = await fetchNewCalculations(projectIds);
      setScores(scores.data);
      setImprovements(projectIds);
      setPendingImprovements({
        toAdd: [],
        toRemove: [],
      });
      setBudgetId(undefined);
      if (!selectedMetric) {
        setSelectedMetric(metrics[0].name);
      }
    } finally {
      setCalculating(false);
    }
  };

  return (
    <Grid item container direction="row" flexWrap="nowrap" flexGrow={1}>
      {/* Start side panel */}
      <Grid
        item
        spacing={2}
        paddingRight={2}
        paddingTop={2}
        paddingBottom={4}
        marginLeft={2}
        height="100vh"
        container
        direction="column"
        xs={12}
        md={2}
        overflow="auto"
        wrap="nowrap"
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
          reset={reset}
          totalKm={totalKm}
        />
        <Divider sx={{ margin: 2 }} />
        <Grid item>
          <CollapsibleSection defaultOpen label="Existing Lanes">
            <ExistingLaneControls
              setVisibleExistingLanes={setVisibleExistingLanes}
              visibleExistingLanes={visibleExistingLanes}
            />
          </CollapsibleSection>
        </Grid>
        <Grid item container>
          {!!improvements && (
            <CollapsibleSection label="Metrics" defaultOpen={true}>
              <Grid item container spacing={2}>
                <Grid item>
                  <MetricSelector
                    metrics={metrics}
                    setMetric={setMetric}
                    selectedMetric={selectedMetric}
                  />
                </Grid>
                {!!scoreScale && (
                  <Grid item container spacing={2}>
                    {["linear", "log"].includes(scaleType) && (
                      <>
                        <Grid item container justifyContent="space-between">
                          <span>
                            <Typography variant="caption">
                              {formatNumber(
                                maybeLog(scaleType, scoreScale.domain()[0])
                              )}
                            </Typography>
                          </span>
                          <span>
                            <Typography variant="caption">
                              {formatNumber(
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
                        {!!summaryStats && (
                          <Grid
                            item
                            container
                            alignItems="center"
                            wrap="nowrap"
                            spacing={2}
                            justifyContent="space-between"
                          >
                            <Grid item>
                              <Typography>
                                Average increase over baseline:{" "}
                                <Box
                                  component="span"
                                  sx={{
                                    color:
                                      summaryStats[selectedMetric].avg >=
                                      summaryStats[selectedMetric].baselineAvg
                                        ? "green"
                                        : "red",
                                  }}
                                >
                                  {formatNumber(
                                    summaryStats[selectedMetric].avg -
                                      summaryStats[selectedMetric].baselineAvg
                                  )}
                                </Box>
                              </Typography>
                            </Grid>
                            <Grid textAlign="end" item>
                              <Button onClick={() => setHistoryModalOpen(true)}>
                                Save
                              </Button>
                            </Grid>
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
                  <>
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
                  </>
                )}
              </Grid>
            </CollapsibleSection>
          )}
        </Grid>
        <Divider sx={{ margin: 2 }} />
        <Grid item container>
          {!!history.length && (
            <CollapsibleSection label="History" defaultOpen={true}>
              <HistoryPanel
                active={activeHistory}
                exportFn={(name) => {
                  // improvements are an array of projectIDs
                  const historyItemProjects = history.find(
                    (h) => h.name === name
                  )?.improvements;
                  if (!!historyItemProjects && !!arterials) {
                    const historyItemProjectsSet = new Set(historyItemProjects);

                    const exportArterials = structuredClone(arterials);

                    exportArterials.features = exportArterials.features
                      .filter(
                        ({ properties }) =>
                          !!intersection(
                            historyItemProjectsSet,
                            new Set(
                              properties.budget_project_ids.concat(
                                properties.default_project_id || []
                              )
                            )
                          ).size
                      )
                      .map((f) => {
                        (f.properties as ArterialFeaturePropertiesExport) = {
                          GEO_ID: f.properties.GEO_ID,
                        };
                        return f;
                      });

                    downloadGeojson(
                      JSON.stringify(exportArterials),
                      `${name}.geojson`
                    );
                  }
                }}
                history={history}
                //TODO: useCallbacks here...
                resetBaseline={() => {
                  if (defaultScores) {
                    const baseline =
                      calculateDefaultBaselineSummaryStats(defaultScores);
                    setBaseline(baseline);
                  }
                }}
                removeFromHistory={(name: string) => {
                  setHistory(history.filter((h) => h.name !== name));
                }}
                setBaseline={(scores: ScoreResults) => {
                  const baseline = calculateSummaryStats(
                    scores,
                    daCount || Object.values(scores).length
                  );
                  setBaseline(baseline);
                }}
                updateView={restoreHistory}
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
      <LoadingOverlay
        open={calculating}
        message="Calculating accessibility...."
      />

      <HistoryModal
        open={historyModalOpen}
        history={history}
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
