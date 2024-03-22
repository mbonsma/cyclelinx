"use client";

import React, { useEffect } from "react";
import { GeoJsonObject } from "geojson";
import styled from "@emotion/styled";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { LatLngBounds, LatLng, GeoJSON as LGeoJSON } from "leaflet";
import { scaleLinear } from "d3-scale";
import { extent } from "d3-array";
import {
  EXISTING_LANE_TYPE,
  EXISTING_LANE_NAME_MAP,
  metricScale,
  existingScale,
} from "@/app/page";
import { GroupedScoredDA, ScoreSet } from "@/lib/ts/types";

/*
    This is basically a context consumer
    We place it in the component and it is then nested in the context provider and we can access it
*/
const Handler: React.FC<{
  existingLanes?: any;
  selected: any;
  scores: GroupedScoredDA[];
  selectedMetric?: string;
  visibleExistingLanes: EXISTING_LANE_TYPE[];
}> = ({
  selected,
  scores,
  selectedMetric,
  existingLanes,
  visibleExistingLanes,
}) => {
  const map = useMap();

  useEffect(() => {
    map.eachLayer((l) => {
      if (l?.feature && l?.feature.geometry.type === "MultiPolygon") {
        map.removeLayer(l);
      }
    });

    if (scores && selectedMetric) {
      const scoreRange = extent(
        scores.map((s) => s.scores.budget[selectedMetric])
      ) as [number, number];
      const opacityScale = scaleLinear(scoreRange, [0.1, 0.75]);

      scores.forEach((d) => {
        map.addLayer(
          new LGeoJSON(d.da as GeoJsonObject, {
            style: {
              fillColor: metricScale(selectedMetric),
              fillOpacity: opacityScale(d.scores.budget[selectedMetric]),
              stroke: false,
            },
            onEachFeature: (f, l) => {
              l.bindPopup(
                `<div><strong>DAUID:</strong>&nbsp;${f.properties.DAUID}</div>
                <div><strong>Recreation:</strong>&nbsp;${d.scores.budget.recreation}</div>
                <div><strong>Food:</strong>&nbsp;${d.scores.budget.food}</div>
                <div><strong>Employment:</strong>&nbsp;${d.scores.budget.employment}</div>
                `
              );
            },
          })
        );
      });
    }
  }, [scores, selectedMetric]);

  useEffect(() => {
    if (existingLanes) {
      let removal = false;
      let toAdd = [...visibleExistingLanes];

      map.eachLayer((l: any) => {
        const layerProps = l?.feature?.geometry.properties;
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
  }, [existingLanes, visibleExistingLanes]);

  useEffect(() => {
    if (selected) {
      const layer = new LGeoJSON(selected as GeoJsonObject);

      map.eachLayer((l) => {
        if (
          l?.feature?.geometry.properties.feature_type == "improvement_feature"
        ) {
          map.removeLayer(l);
        }
      });
      map.addLayer(layer);
    }
  }, [selected]);

  return null;
};

//GTA, more or less
const c1 = new LatLng(43.72, -79.21);
const c2 = new LatLng(43.61, -79.45);

const MapViewer: React.FC<{
  existingLanes?: any;
  features: any;
  scores: GroupedScoredDA[];
  selectedMetric?: string;
  visibleExistingLanes: EXISTING_LANE_TYPE[];
}> = ({
  existingLanes,
  features,
  scores,
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
      selected={features}
      scores={scores}
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
