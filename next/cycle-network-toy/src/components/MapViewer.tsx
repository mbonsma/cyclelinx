"use client";

import React, { useEffect } from "react";
import { GeoJsonObject } from "geojson";
import styled from "@emotion/styled";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { LatLngBounds, LatLng, GeoJSON as LGeoJSON } from "leaflet";
import {
  EXISTING_LANE_TYPE,
  EXISTING_LANE_NAME_MAP,
  metricScale,
  opacityScale,
  existingScale,
} from "@/app/page";

/*
    This is basically a context consumer...
    We place it in the component and it is then nested in the context provider and we can access it
*/
const Handler: React.FC<{
  existingLanes?: any;
  selected: any;
  scores: any;
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
      scores
        .filter((d: any) => d.metric === selectedMetric)
        .forEach((d: any) => {
          map.addLayer(
            new LGeoJSON(d.da as GeoJsonObject, {
              style: {
                fillColor: metricScale(d.metric),
                fillOpacity: opacityScale(d.score),
                stroke: false,
              },
              onEachFeature: (f, l) => {
                l.bindPopup(
                  `<div><strong>DAUID:</strong>&nbsp;${f.properties.DAUID}</div>`
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
      const layer = new LGeoJSON(selected as GeoJsonObject, {
        //click handler for features
        onEachFeature: (f, l) =>
          l.on({
            load: async () => {
              return true;
            },
            click: async () => {
              return true;
              // const das = await axios.get<
              //   {
              //     score: number;
              //     metric: string;
              //     da: Record<string, any>;
              //   }[]
              // >(
              //   `http://localhost:9033/arterials/${f.properties.GEO_ID}/scores`
              // );
              // // note that LGeoJSON options has setStyle and addData methods, the latter of which could be used to group by score (if scores often repeat)
              // das.data.forEach((d) => {
              //   map.addLayer(
              //     new LGeoJSON(d.da as GeoJsonObject, {
              //       style: {
              //         fillColor: metricScale(d.metric),
              //         fillOpacity: opacityScale(d.score),
              //         stroke: false,
              //       },
              //     })
              //   );
              // });
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
const c1 = new LatLng(43.72, -79.21);
const c2 = new LatLng(43.61, -79.45);

const MapViewer: React.FC<{
  existingLanes?: any;
  features: any;
  scores: any;
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
