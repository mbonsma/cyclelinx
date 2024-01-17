"use client";

import React, { useState, useEffect } from "react";
import { GeoJsonObject, Geometry } from "geojson";
import styled from "@emotion/styled";
//we might need these as dynamic imports?
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { LatLngBounds, LatLng, GeoJSON as LGeoJSON } from "leaflet";
import budget40 from "../app/lib/geojson/budget_40";
import { default as budget80 } from "../app/lib/geojson/budget_80";
import { default as budget120 } from "../app/lib/geojson/budget_120";
import { default as budget160 } from "../app/lib/geojson/budget_160";
import { default as budget200 } from "../app/lib/geojson/budget_200";
import { default as budget240 } from "../app/lib/geojson/budget_240";
import { default as budget280 } from "../app/lib/geojson/budget_280";
import { default as budget320 } from "../app/lib/geojson/budget_320";
import { default as budget360 } from "../app/lib/geojson/budget_360";
import { default as budget400 } from "../app/lib/geojson/budget_400";
import { default as budget440 } from "../app/lib/geojson/budget_440";
import { default as budget480 } from "../app/lib/geojson/budget_480";

export const BUDGET_MAP = {
  40: budget40,
  80: budget80,
  120: budget120,
  160: budget160,
  200: budget200,
  240: budget240,
  280: budget280,
  320: budget320,
  360: budget360,
  400: budget400,
  440: budget440,
  480: budget480,
};

/*
    This is basically a context consumer...
    We place it in the component and it is then nested in the context provider and we can access it
*/
const Handler: React.FC<{ selected: keyof typeof BUDGET_MAP }> = ({
  selected,
}) => {
  const [currentLayer, setCurrentLayer] = useState<
    LGeoJSON<any, Geometry> | undefined
  >(undefined);

  const map = useMap();

  /* const map = useMapEvents({
    moveend: (e) => {
      console.log(map.getBounds());
    },
  }); */

  useEffect(() => {
    const layer = new LGeoJSON(BUDGET_MAP[selected] as GeoJsonObject);
    if (currentLayer) {
      map.removeLayer(currentLayer);
    }
    map.addLayer(layer);
    setCurrentLayer(layer);
  }, [map, selected]);

  return null;
};

const c1 = new LatLng(43.76, -79.17);
const c2 = new LatLng(43.65, -79.65);

const MapViewer: React.FC<{ budget: keyof typeof BUDGET_MAP }> = ({
  budget,
}) => (
  <StyledLeafletContainer
    bounds={new LatLngBounds(c1, c2)}
    scrollWheelZoom={true}
  >
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    />
    <Handler selected={budget} />
  </StyledLeafletContainer>
);

export default MapViewer;

interface SelectedLayerProps {
  selectedBudget: keyof typeof BUDGET_MAP;
}

/* These doesn't work, evidently --- we can't just replace */
const SelectedLayer: React.FC<SelectedLayerProps> = ({ selectedBudget }) => (
  <GeoJSON data={BUDGET_MAP[selectedBudget] as GeoJsonObject} />
);

const SelectedLayer2: React.FC<SelectedLayerProps> = ({ selectedBudget }) => (
  <>
    {getEntries(BUDGET_MAP).map(([k, v]) => (
      <>
        {selectedBudget === k && (
          <GeoJSON data={BUDGET_MAP[k] as GeoJsonObject} />
        )}
      </>
    ))}
  </>
);

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
