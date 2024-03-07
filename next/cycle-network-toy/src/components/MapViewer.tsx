"use client";

import React, { useEffect } from "react";
import axios from "axios";
import { GeoJsonObject } from "geojson";
import styled from "@emotion/styled";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { LatLngBounds, LatLng, GeoJSON as LGeoJSON } from "leaflet";
import { scaleLinear, scaleOrdinal } from "d3-scale";

const METRICS = ["recreation", "food", "employment"];
const SCORE_RANGE = [1, 10];

const metricScale = scaleOrdinal(METRICS, ["red", "green", "blue"]);
const opacityScale = scaleLinear(SCORE_RANGE, [0.1, 0.75]);

/*
    This is basically a context consumer...
    We place it in the component and it is then nested in the context provider and we can access it
*/
const Handler: React.FC<{ selected: any }> = ({ selected }) => {
  const map = useMap();

  useEffect(() => {
    if (selected) {
      const layer = new LGeoJSON(selected as GeoJsonObject, {
        //click handler for features
        onEachFeature: (f, l) =>
          l.on({
            click: async () => {
              const das = await axios.get<
                {
                  score: number;
                  metric: string;
                  da: Record<string, any>;
                }[]
              >(
                `http://localhost:9033/arterials/${f.properties.GEO_ID}/scores`
              );

              // note that LGeoJSON options has setStyle and addData methods, the latter of which could be used to group by score (if scores often repeat)
              das.data.forEach((d) => {
                map.addLayer(
                  new LGeoJSON(d.da as GeoJsonObject, {
                    style: {
                      fillColor: metricScale(d.metric),
                      fillOpacity: opacityScale(d.score),
                      stroke: false,
                    },
                  })
                );
              });
            },
          }),
      });
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
const c1 = new LatLng(43.76, -79.17);
const c2 = new LatLng(43.65, -79.65);

const MapViewer: React.FC<{ features: any }> = ({ features }) => (
  <StyledLeafletContainer
    bounds={new LatLngBounds(c1, c2)}
    scrollWheelZoom={true}
  >
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    />
    <Handler selected={features} />
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
