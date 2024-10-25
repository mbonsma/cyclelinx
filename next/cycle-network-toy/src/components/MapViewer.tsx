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
import {
  ImprovementFeatureGeoJSON,
  ScoreResults,
  ScoreSet,
} from "@/lib/ts/types";
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
  improvements?: ImprovementFeatureGeoJSON;
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
  const { das, existingLanes } = useContext(StaticDataContext);
  const theme = useTheme();

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

  // Add score DAs
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

  // manage improvements
  useEffect(() => {
    /* Add the propsed new lanes */
    if (improvements) {
      const layer = new LGeoJSON(improvements as GeoJsonObject, {
        style: (feature) => ({
          color: pendingImprovements.toRemove.includes(
            feature?.properties.budget_project_id
          )
            ? theme.palette.projectRemoveColor
            : theme.palette.projectColor,
        }),
        onEachFeature: (f, l) => {
          l.addEventListener("click", (e) => {
            const projectId =
              e.sourceTarget.feature.properties.budget_project_id;

            if (pendingImprovements.toRemove.includes(projectId)) {
              setPendingImprovements(({ toAdd, toRemove }) => ({
                toRemove: toRemove.filter((p) => p !== projectId),
                toAdd,
              }));
            } else {
              setPendingImprovements(({ toAdd, toRemove }) => ({
                toRemove: toRemove.concat(projectId),
                toAdd,
              }));
            }
          });
        },
      });

      // remove old improvements and add new ones
      map.eachLayer((l) => {
        //todo: add click handler to remove
        if (l?.feature?.properties.feature_type == "improvement_feature") {
          map.removeLayer(l);
        }
      });

      map.addLayer(layer);
    }
  }, [improvements, map, theme, pendingImprovements, setPendingImprovements]);

  return null;
};

//GTA, more or less
const c1 = new LatLng(43.72, -79.21);
const c2 = new LatLng(43.61, -79.45);

const MapViewer: React.FC<{
  improvements?: ImprovementFeatureGeoJSON;
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
