"use client";

import dynamic from "next/dynamic";

import React from "react";
import styled from "@emotion/styled";
import { MapContainer, TileLayer } from "react-leaflet";
import { LatLngBounds, LatLng } from "leaflet";
import {
  ScaleLinear,
  ScaleOrdinal,
  ScaleQuantile,
  ScaleSymLog,
} from "d3-scale";
import { HamburgerMenu } from "@/components";
import {
  EXISTING_LANE_TYPE,
  PendingImprovements,
  ScoreResults,
  ScoreSet,
} from "@/lib/ts/types";

// we need to import this dynamically b/c leaflet needs `window` and can't be prerendered
const DALayer = dynamic(() => import("@/components/DALayer"), {
  ssr: false,
});

const ExistingLanesLayer = dynamic(
  () => import("@/components/ExistingLanesLayer"),
  {
    ssr: false,
  }
);

const ArterialLayer = dynamic(() => import("@/components/ArterialLayer"), {
  ssr: false,
});

//GTA, more or less
const sw = new LatLng(43.69, -79.15);
const ne = new LatLng(43.79, -79.61);

const MapViewer: React.FC<{
  improvements?: number[];
  scoreScale?:
    | ScaleLinear<number, number>
    | ScaleQuantile<number, never>
    | ScaleSymLog<number, number, never>;
  metricTypeScale: ScaleOrdinal<string, string, never>;
  pendingImprovements: PendingImprovements;
  scores?: ScoreResults;
  scoreSet: keyof ScoreSet;
  selectedMetric?: string;
  setPendingImprovements: React.Dispatch<
    React.SetStateAction<PendingImprovements>
  >;
  visibleExistingLanes: EXISTING_LANE_TYPE[];
}> = ({
  improvements,
  metricTypeScale,
  pendingImprovements,
  scores,
  scoreScale,
  scoreSet,
  selectedMetric,
  setPendingImprovements,
  visibleExistingLanes,
}) => {
  return (
    <StyledLeafletContainer
      bounds={new LatLngBounds(sw, ne)}
      scrollWheelZoom={true}
    >
      <HamburgerMenu absolute />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a href='https://carto.com/attributions'>CARTO</a>"
      />
      <DALayer
        metricTypeScale={metricTypeScale}
        scores={scores}
        scoreScale={scoreScale}
        scoreSet={scoreSet}
        selectedMetric={selectedMetric}
      />
      <ExistingLanesLayer visibleExistingLanes={visibleExistingLanes} />
      <ArterialLayer
        improvements={improvements}
        setPendingImprovements={setPendingImprovements}
        pendingImprovements={pendingImprovements}
      />
      {/* <IntersectionFeatures /> */}
    </StyledLeafletContainer>
  );
};

const StyledLeafletContainer = styled(MapContainer)(() => ({
  width: "100%",
  height: "100vh",
  //remove logo
  ".leaflet-control-attribution.leaflet-control": {
    display: "none",
  },
  "&.intersection": {
    "&:hover": {
      color: "purple",
    },
  },
}));

export default MapViewer;
