"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
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
import { DAContext } from "@/providers/DAContextProvider";

const buildValueTooltip = (item: string, data: Record<string, number>) =>
  `<div><strong>${
    item.slice(0, 1).toUpperCase() + item.slice(1)
  }:</strong>&nbsp;${formatDigit(data[item])}`;

const Handler: React.FC<{
  existingLanes?: any;
  scoreScale?:
    | ScaleLinear<number, number>
    | ScaleQuantile<number, never>
    | ScaleSymLog<number, number, never>;
  metricTypeScale: ScaleOrdinal<string, string, never>;
  selected: any;
  selectedMetric?: string;
  scores?: ScoreResults;
  scoreSet: keyof ScoreSet;
  visibleExistingLanes: EXISTING_LANE_TYPE[];
}> = ({
  existingLanes,
  scoreScale,
  metricTypeScale,
  selected,
  scores,
  scoreSet,
  selectedMetric,
  visibleExistingLanes,
}) => {
  const [dasSet, setDasSet] = useState(false);
  const map = useMap();
  const das = useContext(DAContext);

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

  useEffect(() => {
    if (!!scores && !!selectedMetric && !!scoreScale) {
      map.eachLayer((l) => {
        //it seems we have the full feature layer as well as layers broken out...
        if (l.options.attribution === "DAs" && !!l.feature) {
          l.setStyle({
            fillColor: metricTypeScale(selectedMetric),
            fillOpacity: scoreScale(
              scores[l.feature.properties.id.toString()].scores[scoreSet][
                selectedMetric
              ]
            ),
          });

          l.bindPopup(
            `<div><strong>DAUID:</strong>&nbsp;${l.feature.properties.DAUID}</div>` +
              metricTypeScale
                .domain()
                .map((v) =>
                  buildValueTooltip(
                    v,
                    scores[l.feature.properties.id.toString()].scores[scoreSet]
                  )
                )
                .join("\n")
          );
        }
      });
    }
  }, [das, scores, selectedMetric, scoreScale, scoreSet, metricTypeScale, map]);

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
  scoreScale?:
    | ScaleLinear<number, number>
    | ScaleQuantile<number, never>
    | ScaleSymLog<number, number, never>;
  metricTypeScale: ScaleOrdinal<string, string, never>;
  scores?: ScoreResults;
  scoreSet: keyof ScoreSet;
  selectedMetric?: string;
  visibleExistingLanes: EXISTING_LANE_TYPE[];
}> = ({
  existingLanes,
  features,
  scoreScale,
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
      scoreScale={scoreScale}
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
