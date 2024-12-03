"use client";

import React, { useContext, useEffect, useState } from "react";
import styled from "@emotion/styled";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import {
  LatLngBounds,
  LatLng,
  GeoJSON as LGeoJSON,
  LeafletEvent,
} from "leaflet";
import { format } from "d3-format";
import {
  ScaleLinear,
  ScaleOrdinal,
  ScaleQuantile,
  ScaleSymLog,
} from "d3-scale";
import union from "set.prototype.union";
import difference from "set.prototype.difference";
import intersection from "set.prototype.intersection";
import { capitalize, useTheme } from "@mui/material";
import {
  EXISTING_LANE_TYPE,
  isFeatureGroup,
  isGeoJSONFeature,
  PendingImprovements,
  ScoreResults,
  ScoreSet,
} from "@/lib/ts/types";
import appTheme from "@/lib/mui/theme";
import HamburgerMenu from "./HamburgerMenu";
import { StaticDataContext } from "@/providers/StaticDataProvider";
import {
  EXISTING_LANE_NAME_MAP,
  existingScale,
  formatNumber,
} from "@/lib/ts/util";

const formatPct = format(",.1%");

const buildValueTooltip = (
  metric: string,
  scores: ScoreSet,
  scoreType: keyof ScoreSet
) => {
  let pctChange = "";
  let color = "inherit";

  if (scoreType !== "diff") {
    pctChange = "";
  } else if (scores.original[metric] === 0 && scores.diff[metric] === 0) {
    pctChange = "(N/A)";
  } else if (scores.original[metric] === 0 && scores.diff[metric] !== 0) {
    pctChange = "(Inf)";
    color = "green";
  } else {
    pctChange = `(${formatPct(scores.diff[metric] / scores.original[metric])})`;
    color = "green";
  }

  return `<div><strong>${capitalize(metric)}:</strong>&nbsp;${formatNumber(
    scores[scoreType][metric]
  )}<span style="color:${color};">${pctChange}</span></div>`;
};

const getAllProjectIds = ({
  default_project_id,
  budget_project_ids,
}: {
  default_project_id: number | null;
  budget_project_ids: number[];
}) => {
  const retSet = new Set<number>();
  budget_project_ids.forEach((b) => retSet.add(b));
  if (default_project_id) {
    retSet.add(default_project_id);
  }
  return retSet;
};

const Handler: React.FC<{
  scoreScale?:
    | ScaleLinear<number, number>
    | ScaleQuantile<number, never>
    | ScaleSymLog<number, number, never>;
  metricTypeScale: ScaleOrdinal<string, string, never>;
  improvements?: number[];
  pendingImprovements: PendingImprovements;
  selectedMetric?: string;
  setPendingImprovements: React.Dispatch<
    React.SetStateAction<PendingImprovements>
  >;
  scores?: ScoreResults;
  scoreSet: keyof ScoreSet;
  visibleExistingLanes: EXISTING_LANE_TYPE[];
}> = ({
  scoreScale,
  metricTypeScale,
  improvements,
  pendingImprovements,
  scores,
  scoreSet,
  selectedMetric,
  setPendingImprovements,
  visibleExistingLanes,
}) => {
  const [arterialsSet, setArterialsSet] = useState(false);
  const [dasSet, setDasSet] = useState(false);
  const [existingLanesSet, setExistingLanesSet] = useState(false);
  const map = useMap();
  const { arterials, das, existingLanes } = useContext(StaticDataContext);
  const theme = useTheme();

  // add DAs
  useEffect(() => {
    if (!dasSet && !!map && !!das) {
      //this will create a single layer for each feature in the bundle
      map.addLayer(
        new LGeoJSON(das, {
          style: {
            stroke: false,
            fillColor: "none",
            fillOpacity: 0,
          },
          attribution: "DAs", //using this as a handle
        })
      );
      setDasSet(true);
    }
  }, [das, dasSet, map, setDasSet, scores]);

  // manage existing lanes
  useEffect(() => {
    if (!!existingLanes) {
      if (!existingLanesSet) {
        map.addLayer(
          new LGeoJSON(existingLanes, {
            style: {
              stroke: false,
              fillColor: "none",
              fillOpacity: 0,
            },
            attribution: "existingLanes",
          })
        );
        setExistingLanesSet(true);
      }
      map.eachLayer((l: any) => {
        const layerProps = l?.feature?.properties;
        if (
          !!layerProps?.INFRA_HIGHORDER &&
          l?.options?.attribution === "existingLanes"
        ) {
          if (
            !visibleExistingLanes.includes(
              EXISTING_LANE_NAME_MAP[layerProps.INFRA_HIGHORDER]
            )
          ) {
            l.setStyle({
              stroke: false,
              fillColor: "none",
              fillOpacity: 0,
            });
          } else {
            l.setStyle({
              stroke: true,
              fillColor: existingScale(
                EXISTING_LANE_NAME_MAP[layerProps.INFRA_HIGHORDER]
              ),
              color: existingScale(
                EXISTING_LANE_NAME_MAP[layerProps.INFRA_HIGHORDER]
              ),
              fillOpacity: 0.75,
              opacity: 1,
            });
          }
        }
      });
    }
  }, [existingLanes, existingLanesSet, visibleExistingLanes, map]);

  //add Arterials w/ click behavior and styling
  //we use the update event to keep the callbacks up to date with react's data
  useEffect(() => {
    if (!!map) {
      if (!arterialsSet && !!arterials) {
        const layer = new LGeoJSON(arterials, {
          style: (f) => {
            if (f) {
              const projectId = f.properties.default_project_id;
              if (projectId) {
                return {
                  stroke: true,
                  opacity: 0.15,
                };
              }
            }
            return {
              stroke: true,
              opacity: 0,
            };
          },
          attribution: "arterial", //using this as a handle
          onEachFeature: (f, l) => {
            l.on("update", (e: LeafletEvent) => {
              //@ts-ignore
              const improvements = e.improvements as number[];
              const pendingImprovements =
                //@ts-ignore
                e.pendingImprovements as PendingImprovements;

              const allProjectIds = getAllProjectIds(f.properties);
              const improvmentsSet = new Set(improvements);
              const removeSet = new Set(pendingImprovements.toRemove);
              const addSet = new Set(pendingImprovements.toAdd);
              if (allProjectIds.size && isFeatureGroup(l)) {
                //if it's not in any set, base styling
                if (
                  !intersection(addSet, allProjectIds).size &&
                  !intersection(improvmentsSet, allProjectIds).size
                ) {
                  l.setStyle({
                    stroke: true,
                    color: theme.palette.addableRoadColor,
                    opacity: 0.075,
                  });
                  l.off("mouseover");
                  l.off("mouseout");
                  l.on("mouseover", () => {
                    (l as any)._path.style["stroke-opacity"] = 1;
                  });

                  l.on("mouseout", () => {
                    (l as any)._path.style["stroke-opacity"] = 0.075;
                  });
                } else if (intersection(removeSet, allProjectIds).size) {
                  l.setStyle({
                    stroke: true,
                    color: theme.palette.projectRemoveColor,
                    opacity: 1,
                  });
                  l.off("mouseover");
                  l.off("mouseout");
                } else if (!!intersection(addSet, allProjectIds).size) {
                  {
                    l.setStyle({
                      stroke: true,
                      color: theme.palette.projectAddColor,
                      opacity: 1,
                    });
                  }
                  l.off("mouseover");
                  l.off("mouseout");
                  // if it's an existing improvement, give it the improvement color
                } else if (!!intersection(improvmentsSet, allProjectIds).size) {
                  l.setStyle({
                    stroke: true,
                    color: theme.palette.projectColor,
                    opacity: 1,
                  });
                  l.off("mouseover");
                  l.off("mouseout");
                }
              }
              l.removeEventListener("click");
              l.addEventListener("click", (e) => {
                const allProjectIds = getAllProjectIds(
                  e.sourceTarget.feature.properties
                );

                if (!!allProjectIds.size) {
                  // if user added already, remove from add list
                  if (!!intersection(addSet, allProjectIds).size) {
                    setPendingImprovements(({ toRemove }) => ({
                      toAdd: [...difference(addSet, allProjectIds)],
                      toRemove,
                    }));

                    // if user has marked for removal, remove from remove list
                  } else if (!!intersection(removeSet, allProjectIds).size) {
                    setPendingImprovements(({ toAdd }) => ({
                      toRemove: [...difference(removeSet, allProjectIds)],
                      toAdd,
                    }));
                  } //if it's in the improvements list, they're removing
                  else if (!!intersection(improvmentsSet, allProjectIds).size) {
                    setPendingImprovements(({ toAdd }) => ({
                      toRemove: [...union(removeSet, allProjectIds)],
                      toAdd,
                    }));
                  }
                  // otherwise they're marking it to add
                  else {
                    setPendingImprovements(({ toRemove }) => ({
                      toAdd: [...union(addSet, allProjectIds)],
                      toRemove,
                    }));
                  }
                }
              });
            });
          }, //end each feature
        }); //end layer
        map.addLayer(layer);
        setArterialsSet(true);
      } // end arterial set conditional
    } //end map conditional
  }, [
    arterials,
    arterialsSet,
    map,
    improvements,
    pendingImprovements,
    setPendingImprovements,
    theme.palette.projectAddColor,
    theme.palette.projectRemoveColor,
    theme.palette.projectColor,
  ]);

  //fire update event to sync state with callbacks
  useEffect(() => {
    map.eachLayer((l) =>
      l.fire("update", { improvements, pendingImprovements })
    );
  }, [improvements, map, pendingImprovements]);

  // Add scores
  useEffect(() => {
    map.eachLayer((l) => {
      if (l.options.attribution === "DAs" && isFeatureGroup(l) && !!l.feature) {
        //we won't necessarily have a score for every DA when we calculate on the fly
        if (
          !!scores &&
          !!selectedMetric &&
          !!scoreScale &&
          isGeoJSONFeature(l.feature)
        ) {
          if (scores[l.feature.properties.id.toString()]) {
            const da_score_set =
              scores[l.feature.properties.id.toString()].scores;
            const da_scores = da_score_set[scoreSet];
            l.setStyle({
              fillColor: metricTypeScale(selectedMetric),
              fillOpacity: scoreScale(da_scores[selectedMetric]),
            });

            l.bindPopup(
              `<div><strong>DAUID:</strong>&nbsp;${l.feature.properties.DAUID}</div>` +
                metricTypeScale
                  .domain()
                  .map((v) => buildValueTooltip(v, da_score_set, scoreSet))
                  .join("\n")
            );
          }
        } else {
          l.setStyle({
            fillColor: "none",
            fillOpacity: 0,
          });
          l.unbindPopup();
        }
      }
    });
  }, [das, scores, selectedMetric, scoreScale, scoreSet, metricTypeScale, map]);

  return null;
};

//GTA, more or less
const c1 = new LatLng(43.72, -79.21);
const c2 = new LatLng(43.61, -79.45);

const MapViewer: React.FC<{
  improvements?: number[];
  scoreScale?:
    | ScaleLinear<number, number>
    | ScaleQuantile<number, never>
    | ScaleSymLog<number, number, never>;
  metricTypeScale: ScaleOrdinal<string, string, never>;
  pendingImprovements: PendingImprovements;
  scores?: ScoreResults;
  scoreSet: keyof ScoreSet;
  selectedMetric?: string;
  setPendingImprovements: React.Dispatch<
    React.SetStateAction<PendingImprovements>
  >;
  visibleExistingLanes: EXISTING_LANE_TYPE[];
}> = ({
  improvements,
  scoreScale,
  metricTypeScale,
  pendingImprovements,
  scores,
  scoreSet,
  selectedMetric,
  setPendingImprovements,
  visibleExistingLanes,
}) => {
  const [handlerVisible, setHandlerVisible] = useState(false);
  return (
    <StyledLeafletContainer
      bounds={new LatLngBounds(c1, c2)}
      scrollWheelZoom={true}
      // This prevents the handler and map from rendering at once, which causes lag
      // Instead, we render one at a time, and this seems like the best way to do it
      // given the circumstances.
      whenReady={() => setTimeout(() => setHandlerVisible(true), 500)}
    >
      <HamburgerMenu absolute />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a href='https://carto.com/attributions'>CARTO</a>"
      />
      {handlerVisible && (
        <Handler
          scoreScale={scoreScale}
          metricTypeScale={metricTypeScale}
          improvements={improvements}
          pendingImprovements={pendingImprovements}
          scores={scores}
          scoreSet={scoreSet}
          setPendingImprovements={setPendingImprovements}
          selectedMetric={selectedMetric}
          visibleExistingLanes={visibleExistingLanes}
        />
      )}
    </StyledLeafletContainer>
  );
};

const StyledLeafletContainer = styled(MapContainer)(() => ({
  width: "100%",
  height: "100vh",
  //remove logo
  ".leaflet-control-attribution.leaflet-control": {
    display: "none",
  },
  path: {
    "&.addable": {
      // "&:hover": {
      pointerEvents: "all",
      stroke: appTheme.palette.projectAddColor,
      strokeOpacity: 1,
      // },
    },
    "&.removable": {
      // "&:hover": {
      pointerEvents: "all",
      stroke: appTheme.palette.projectRemoveColor,
      strokeOpacity: 1,
      // },
    },
    "&.returnable": {
      // "&:hover": {
      pointerEvents: "all",
      stroke: "",
      strokeOpacity: 0,
      // },
    },
  },
}));

export default MapViewer;
