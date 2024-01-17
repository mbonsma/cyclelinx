"use client";

import React from "react";
import { GeoJsonObject } from "geojson";
import styled from "@emotion/styled";
//we might need these as dynamic imports?
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { LatLngBounds, LatLng } from "leaflet";
import budget40 from "../../public/budget_40.json";
import budget80 from "../../public/budget_80.json";
import budget120 from "../../public/budget_120.json";
import budget160 from "../../public/budget_160.json";
import budget200 from "../../public/budget_200.json";
import budget240 from "../../public/budget_240.json";
import budget280 from "../../public/budget_280.json";
import budget320 from "../../public/budget_320.json";
import budget360 from "../../public/budget_360.json";
import budget400 from "../../public/budget_400.json";
import budget440 from "../../public/budget_440.json";
import budget480 from "../../public/budget_480.json";

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

const c1 = new LatLng(43.8, -79.4);
const c2 = new LatLng(43.6, -79.39);

const MapViewer: React.FC<{ budget: keyof typeof BUDGET_MAP }> = ({
  budget,
}) => (
  <StyledLeafletContainer
    bounds={new LatLngBounds(c1, c2)}
    zoom={12}
    scrollWheelZoom={true}
  >
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {budget === 40 && <GeoJSON data={BUDGET_MAP[budget] as GeoJsonObject} />}
    {budget === 80 && <GeoJSON data={BUDGET_MAP[budget] as GeoJsonObject} />}
    {budget === 120 && <GeoJSON data={BUDGET_MAP[budget] as GeoJsonObject} />}
    {budget === 160 && <GeoJSON data={BUDGET_MAP[budget] as GeoJsonObject} />}
    {budget === 200 && <GeoJSON data={BUDGET_MAP[budget] as GeoJsonObject} />}
    {budget === 240 && <GeoJSON data={BUDGET_MAP[budget] as GeoJsonObject} />}
    {budget === 280 && <GeoJSON data={BUDGET_MAP[budget] as GeoJsonObject} />}
    {budget === 320 && <GeoJSON data={BUDGET_MAP[budget] as GeoJsonObject} />}
    {budget === 360 && <GeoJSON data={BUDGET_MAP[budget] as GeoJsonObject} />}
    {budget === 400 && <GeoJSON data={BUDGET_MAP[budget] as GeoJsonObject} />}
    {budget === 440 && <GeoJSON data={BUDGET_MAP[budget] as GeoJsonObject} />}
    {budget === 480 && <GeoJSON data={BUDGET_MAP[budget] as GeoJsonObject} />}
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
`;

export const getEntries = <T extends Record<any, any>>(obj: T) =>
  Object.entries(obj) as [keyof T, T[keyof T]][];
