"use client";

import React, { useState, useEffect } from "react";
import { GeoJsonObject, Geometry } from "geojson";
import styled from "@emotion/styled";
//we might need these as dynamic imports?
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import { LatLngBounds, LatLng, GeoJSON as LGeoJSON } from "leaflet";
import budget40 from "../lib/geojson/budget_40";
import { default as budget80 } from "../lib/geojson/budget_80";
import { default as budget120 } from "../lib/geojson/budget_120";
import { default as budget160 } from "../lib/geojson/budget_160";
import { default as budget200 } from "../lib/geojson/budget_200";
import { default as budget240 } from "../lib/geojson/budget_240";
import { default as budget280 } from "../lib/geojson/budget_280";
import { default as budget320 } from "../lib/geojson/budget_320";
import { default as budget360 } from "../lib/geojson/budget_360";
import { default as budget400 } from "../lib/geojson/budget_400";
import { default as budget440 } from "../lib/geojson/budget_440";
import { default as budget480 } from "../lib/geojson/budget_480";

/*
    This is basically a context consumer...
    We place it in the component and it is then nested in the context provider and we can access it
*/
const Handler: React.FC<{ selected: any }> = ({ selected }) => {
  const [currentLayer, setCurrentLayer] = useState<
    LGeoJSON<any, Geometry> | undefined
  >(undefined);

  //const map = useMap();

  const map = useMapEvents({
    // moveend: (e) => {
    //   console.log(e);
    //   console.log(map.getBounds());
    // },
    // click: (e) => {
    //   console.log(e);
    // },
  });

  useEffect(() => {
    if (selected) {
      const layer = new LGeoJSON(selected as GeoJsonObject, {
        //click handler for features
        onEachFeature: (f, l) =>
          l.on({
            click: () => console.log(f),
          }),
      });
      if (currentLayer) {
        map.removeLayer(currentLayer);
      }
      map.addLayer(layer);
      setCurrentLayer(layer);
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
