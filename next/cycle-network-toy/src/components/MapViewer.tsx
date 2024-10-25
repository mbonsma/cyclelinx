"use client";

import React, { useContext, useEffect, useState } from "react";
import { GeoJsonObject } from "geojson";
import styled from "@emotion/styled";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { LatLngBounds, LatLng, GeoJSON as LGeoJSON } from "leaflet";
import {
  EXISTING_LANE_TYPE,
  EXISTING_LANE_NAME_MAP,
  existingScale,
  formatDigit,
} from "@/app/page";
import { ScoreResults, ScoreSet } from "@/lib/ts/types";
import {
  ScaleLinear,
  ScaleOrdinal,
  ScaleQuantile,
  ScaleSymLog,
} from "d3-scale";
import { StaticDataContext } from "@/providers/StaticDataProvider";
import { format } from "d3-format";
import { useTheme } from "@mui/material";
import { PendingImprovements } from "./MainViewPanel";

const formatPct = format(",.1%");

const buildValueTooltip = (
  metric: string,
  scores: ScoreSet,
  score_type: keyof ScoreSet
) => {
  const diff = scores.diff[metric] / scores.original[metric];

  const pctChange =
    score_type === "diff" ? (diff ? ` (${formatPct(diff)})` : " (N/A)") : "";

  return `<div><strong>${
    metric.slice(0, 1).toUpperCase() + metric.slice(1)
  }:</strong>&nbsp;${formatDigit(scores[score_type][metric])}${pctChange}`;
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
  const [dasSet, setDasSet] = useState(false);
  const map = useMap();
  const { arterials, das, existingLanes } = useContext(StaticDataContext);
  const theme = useTheme();

  // add DAs
  useEffect(() => {
    if (!dasSet && !!map && !!scores) {
      //this will create a single layer for each feature in the bundle
      map.addLayer(
        new LGeoJSON(das as GeoJsonObject, {
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

  //add Arterials w/ default click behavior and styling
  useEffect(() => {
    if (!!map) {
      //really we should load these once, then use a use effect to update them when arterials change
      //same for the improvements -- not sure we can....
      const layer = new LGeoJSON(arterials as GeoJsonObject, {
        style: (f) => {
          if (f) {
            const projectId = f.properties.default_project_id;
            const allProjectIds = new Set(
              f.properties.budget_project_ids.concat(
                f.properties.default_project_id
              )
            );
            const allImprovments = new Set(improvements);
            const removeSet = new Set(pendingImprovements.toRemove);
            if (pendingImprovements.toAdd.includes(projectId)) {
              return {
                stroke: true,
                color: theme.palette.projectAddColor,
                fillOpacity: 1,
                opacity: 1,
              };
            } else if (removeSet.intersection(allProjectIds).size) {
              return {
                stroke: true,
                color: theme.palette.projectRemoveColor,
                fillOpacity: 1,
                opacity: 1,
              };
            } else if (allImprovments.intersection(allProjectIds).size) {
              return {
                stroke: true,
                color: theme.palette.projectColor,
                fillOpacity: 1,
                opacity: 1,
              };
            } else if (projectId) {
              return {
                stroke: true,
                fillColor: "none",
                opacity: 0.15,
                fillOpacity: 0,
              };
            }
          }
          return {
            stroke: true,
            fillColor: "none",
            opacity: 0,
            fillOpacity: 0,
          };
        },
        attribution: "arterial", //using this as a handle
        onEachFeature: (f, l) => {
          l.addEventListener("click", (e) => {
            const projectId =
              e.sourceTarget.feature.properties.default_project_id ||
              e.sourceTarget.feature.properties.budget_project_ids[0];

            if (projectId) {
              // if user added already, remove from add list
              if (pendingImprovements.toAdd.includes(projectId)) {
                setPendingImprovements(({ toAdd, toRemove }) => ({
                  toAdd: toAdd.filter((p) => p !== projectId),
                  toRemove,
                }));
                // if user marked for removal, remove from remove list
              } else if (pendingImprovements.toRemove.includes(projectId)) {
                setPendingImprovements(({ toAdd, toRemove }) => ({
                  toRemove: toRemove.filter((p) => p !== projectId),
                  toAdd,
                }));
              } else {
                // if it's in a budget improvement, then user is marking for removal
                if (improvements && improvements.includes(projectId)) {
                  setPendingImprovements(({ toAdd, toRemove }) => ({
                    toRemove: toRemove.concat(projectId),
                    toAdd,
                  }));
                }
                // otherwise they're marking it to add
                else {
                  setPendingImprovements(({ toAdd, toRemove }) => ({
                    toAdd: toAdd.concat(projectId),
                    toRemove,
                  }));
                }
              }
            }
          });
        },
      });

      // remove old arterials and add new ones
      map.eachLayer((l) => {
        if (l?.options.attribution == "arterial") {
          map.removeLayer(l);
        }
      });

      map.addLayer(layer);
    }
  }, [
    map,
    arterials,
    improvements,
    pendingImprovements,
    setPendingImprovements,
    theme.palette.projectAddColor,
    theme.palette.projectRemoveColor,
    theme.palette.projectColor,
  ]);

  // Add scores
  useEffect(() => {
    if (!!scores && !!selectedMetric && !!scoreScale) {
      map.eachLayer((l) => {
        //it seems we have the full feature layer as well as layers broken out...
        if (l.options.attribution === "DAs" && !!l.feature) {
          //we won't necessarily have a score for every DA when we calculate on the fly
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
        }
      });
    }
  }, [das, scores, selectedMetric, scoreScale, scoreSet, metricTypeScale, map]);

  // manage existing lanes
  useEffect(() => {
    if (existingLanes) {
      let removal = false;
      let toAdd = [...visibleExistingLanes];

      map.eachLayer((l: any) => {
        const layerProps = l?.feature?.properties;
        //remove removed or filter out those that already exist from add list
        if (
          layerProps &&
          layerProps.feature_type === "existing_lane" &&
          !visibleExistingLanes.includes(
            EXISTING_LANE_NAME_MAP[layerProps.INFRA_HIGHORDER]
          )
        ) {
          map.removeLayer(l);
          removal = true;
        } else if (
          layerProps &&
          toAdd.includes(EXISTING_LANE_NAME_MAP[layerProps.INFRA_HIGHORDER])
        ) {
          toAdd = toAdd.filter(
            (l: any) => l !== EXISTING_LANE_NAME_MAP[layerProps.INFRA_HIGHORDER]
          );
        }
      });

      if (!removal) {
        existingLanes.features.forEach((l: any) => {
          const layerProps = l.properties;
          if (
            layerProps &&
            toAdd.includes(EXISTING_LANE_NAME_MAP[layerProps.INFRA_HIGHORDER])
          ) {
            map.addLayer(
              new LGeoJSON(l as GeoJsonObject, {
                style: {
                  fillColor: existingScale(
                    EXISTING_LANE_NAME_MAP[layerProps.INFRA_HIGHORDER]
                  ),
                  color: existingScale(
                    EXISTING_LANE_NAME_MAP[layerProps.INFRA_HIGHORDER]
                  ),
                  fillOpacity: 0.75,
                },
              })
            );
          }
        });
      }
    }
  }, [existingLanes, visibleExistingLanes, map]);

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
}) => (
  <StyledLeafletContainer
    bounds={new LatLngBounds(c1, c2)}
    scrollWheelZoom={true}
  >
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    />
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
  </StyledLeafletContainer>
);

export default MapViewer;

const StyledLeafletContainer = styled(MapContainer)`
  width: 100%;
  height: 100vh;
  //remove logo
  .leaflet-control-attribution.leaflet-control {
    display: none;
  }
`;

export const getEntries = <T extends Record<any, any>>(obj: T) =>
  Object.entries(obj) as [keyof T, T[keyof T]][];
