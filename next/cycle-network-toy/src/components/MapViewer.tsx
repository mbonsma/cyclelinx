"use client";

import React, { useEffect } from "react";
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
import { GroupedScoredDA, ScoreSet } from "@/lib/ts/types";
import {
  ScaleLinear,
  ScaleOrdinal,
  ScaleQuantile,
  ScaleSymLog,
} from "d3-scale";

//const formatPct = format(".0%");

const buildValueTooltip = (item: string, data: Record<string, number>) =>
  `<div><strong>${
    item.slice(0, 1).toUpperCase() + item.slice(1)
  }:</strong>&nbsp;${formatDigit(data[item])}`;

// const buildValueTooltip = (item: MetricType, data: Record<string, number>) =>
//   `<div><strong>${
//     item.slice(0, 1).toUpperCase() + item.slice(1)
//   }:</strong>&nbsp;${formatDec(data[item])}&nbsp(+${formatPct(
//     data[item] / baselineData[item]
//   )})</div>`;
/*
    This is basically a context consumer
    We place it in the component and it is then nested in the context provider and we can access it
*/
const Handler: React.FC<{
  existingLanes?: any;
  daScale?:
    | ScaleLinear<number, number>
    | ScaleQuantile<number, never>
    | ScaleSymLog<number, number, never>;
  metricTypeScale: ScaleOrdinal<string, string, never>;
  selected: any;
  selectedMetric?: string;
  scores: GroupedScoredDA[];
  scoreSet: keyof ScoreSet;
  visibleExistingLanes: EXISTING_LANE_TYPE[];
}> = ({
  existingLanes,
  daScale,
  metricTypeScale,
  selected,
  scores,
  scoreSet,
  selectedMetric,
  visibleExistingLanes,
}) => {
  const map = useMap();

  /* Update DAs */
  useEffect(() => {
    map.eachLayer((l) => {
      if (l?.feature && l?.feature.geometry.type === "MultiPolygon") {
        map.removeLayer(l);
      }
    });

    if (scores && selectedMetric && daScale) {
      scores.forEach((d) => {
        map.addLayer(
          new LGeoJSON(d.da as GeoJsonObject, {
            style: {
              fillColor: metricTypeScale(selectedMetric),
              fillOpacity: daScale(d.scores[scoreSet][selectedMetric]),
              stroke: false,
            },
            onEachFeature: (f, l) => {
              l.bindPopup(
                `<div><strong>DAUID:</strong>&nbsp;${f.properties.DAUID}</div>` +
                  metricTypeScale
                    .domain()
                    .map((v) => buildValueTooltip(v, d.scores[scoreSet]))
                    .join("\n")
              );
            },
          })
        );
      });
    }
  }, [scores, selectedMetric, daScale, scoreSet, metricTypeScale, map]);

  useEffect(() => {
    if (existingLanes) {
      let removal = false;
      let toAdd = [...visibleExistingLanes];

      map.eachLayer((l: any) => {
        const layerProps = l?.feature?.properties;
        //remove removed or filter out those that already exist from add list
        if (
          layerProps &&
          layerProps.hasOwnProperty("UPGRADED") &&
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

  useEffect(() => {
    if (selected) {
      const layer = new LGeoJSON(selected as GeoJsonObject);

      map.eachLayer((l) => {
        if (l?.feature?.properties.feature_type == "improvement_feature") {
          map.removeLayer(l);
        }
      });
      map.addLayer(layer);
    }
  }, [selected, map]);

  return null;
};

//GTA, more or less
const c1 = new LatLng(43.72, -79.21);
const c2 = new LatLng(43.61, -79.45);

const MapViewer: React.FC<{
  existingLanes?: any;
  features: any;
  daScale?:
    | ScaleLinear<number, number>
    | ScaleQuantile<number, never>
    | ScaleSymLog<number, number, never>;
  metricTypeScale: ScaleOrdinal<string, string, never>;
  scores: GroupedScoredDA[];
  scoreSet: keyof ScoreSet;
  selectedMetric?: string;
  visibleExistingLanes: EXISTING_LANE_TYPE[];
}> = ({
  existingLanes,
  features,
  daScale,
  metricTypeScale,
  scores,
  scoreSet,
  selectedMetric,
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
      existingLanes={existingLanes}
      daScale={daScale}
      metricTypeScale={metricTypeScale}
      selected={features}
      scores={scores}
      scoreSet={scoreSet}
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
