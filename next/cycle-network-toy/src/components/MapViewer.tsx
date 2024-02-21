"use client";

import React, { useEffect } from "react";
import axios from "axios";
import { GeoJsonObject } from "geojson";
import styled from "@emotion/styled";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { LatLngBounds, LatLng, GeoJSON as LGeoJSON } from "leaflet";
import { scaleLinear, scaleOrdinal } from "d3-scale";

// need scales for opacity and color
// color is categorical
// opacity is linear

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
              console.log(das.data);

              // here we need to map.addLayer with the geojson contained in das.data[0].da and color by score
              // also need to remove old layers
              // this must be stored on the map somewhere so we don't have to deal with it here...?

              // yup it sure is, along with feature_type and id in feature.geometry.properties
              // you can iterate through by calling stg like map.eachLayer(l => l.feature.geometry.properties.feature_type == "improvement_feature" )

              console.log(map);

              // note that LGeoJSON options has setStyle and addData methods, the latter of which could be used to group by score (if scores often repeat)
              das.data.forEach((d) => {
                console.log(d.metric);
                console.log(metricScale(d.metric));
                console.log(d.score);
                console.log(opacityScale(d.score));
                map.addLayer(
                  new LGeoJSON(d.da as GeoJsonObject, {
                    style: {
                      fillColor: metricScale(d.metric),
                      fillOpacity: opacityScale(d.score),
                    },
                  })
                );
              });

              // const jsoned = data.data.map((d) => ({
              //   ...d,
              //   da: JSON.stringify(da)
              // }));
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
  width: 80%;
  height: 80vh;
  //remove logo
  .leaflet-control-attribution.leaflet-control {
    display: none;
  }
`;

export const getEntries = <T extends Record<any, any>>(obj: T) =>
  Object.entries(obj) as [keyof T, T[keyof T]][];
