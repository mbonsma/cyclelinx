"use client";

import { Grid } from "@mui/material";
import styled from "@emotion/styled";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { LatLng, LatLngBounds } from "leaflet";
import { GeoJsonObject } from "geojson";
import budget40 from "../../public/budget_40.json";

export default function Home() {
  const c1 = new LatLng(43.6, -79.3);
  const c2 = new LatLng(43.7, -79.4);
  return (
    <main>
      <Grid>
        <StyledLeafletContainer
          bounds={new LatLngBounds(c1, c2)}
          zoom={12}
          scrollWheelZoom={true}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeoJSON data={budget40 as GeoJsonObject} />
        </StyledLeafletContainer>
      </Grid>
    </main>
  );
}

const StyledLeafletContainer = styled(MapContainer)`
  width: 100%;
  height: 100vh;
`;
