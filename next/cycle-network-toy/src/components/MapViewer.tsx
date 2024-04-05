"use client";

import React, { useEffect } from "react";
import { GeoJsonObject } from "geojson";
import styled from "@emotion/styled";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { LatLngBounds, LatLng, GeoJSON as LGeoJSON } from "leaflet";
import { format } from "d3-format";
import {
  EXISTING_LANE_TYPE,
  EXISTING_LANE_NAME_MAP,
  metricScale,
  existingScale,
} from "@/app/page";
import { GroupedScoredDA } from "@/lib/ts/types";
import { ScaleLinear } from "d3-scale";

const formatPct = format(".0%");

/*
    This is basically a context consumer
    We place it in the component and it is then nested in the context provider and we can access it
*/
const Handler: React.FC<{
  existingLanes?: any;
  opacityScale?: ScaleLinear<number, number>;
  selected: any;
  selectedMetric?: string;
  scores: GroupedScoredDA[];
  visibleExistingLanes: EXISTING_LANE_TYPE[];
}> = ({
  existingLanes,
  opacityScale,
  selected,
  scores,
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

    if (scores && selectedMetric && opacityScale) {
      scores.forEach((d) => {
        map.addLayer(
          new LGeoJSON(d.da as GeoJsonObject, {
            style: {
              fillColor: metricScale(selectedMetric),
              fillOpacity: opacityScale(d.scores.budget[selectedMetric]),
              stroke: false,
            },
            //todo: this needs to be a loop
            onEachFeature: (f, l) => {
              l.bindPopup(
                `<div><strong>DAUID:</strong>&nbsp;${f.properties.DAUID}</div>
                <div><strong>Recreation:</strong>&nbsp;${
                  d.scores.budget.recreation
                }&nbsp(+${formatPct(
                  d.scores.budget.recreation / d.scores.default.recreation
                )})</div>
                <div><strong>Food:</strong>&nbsp;${
                  d.scores.budget.food
                }&nbsp(+${formatPct(
                  d.scores.budget.food / d.scores.default.food
                )})</div>
                <div><strong>Employment:</strong>&nbsp;${
                  d.scores.budget.employment
                }&nbsp(+${formatPct(
                  d.scores.budget.employment / d.scores.default.employment
                )})</div>
                `
              );
            },
          })
        );
      });
    }
  }, [scores, selectedMetric, opacityScale]);

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
  }, [existingLanes, visibleExistingLanes]);

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
  }, [selected]);

  return null;
};

//GTA, more or less
const c1 = new LatLng(43.72, -79.21);
const c2 = new LatLng(43.61, -79.45);

const MapViewer: React.FC<{
  existingLanes?: any;
  features: any;
  opacityScale?: ScaleLinear<number, number>;
  scores: GroupedScoredDA[];
  selectedMetric?: string;
  visibleExistingLanes: EXISTING_LANE_TYPE[];
}> = ({
  existingLanes,
  features,
  opacityScale,
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
      opacityScale={opacityScale}
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
