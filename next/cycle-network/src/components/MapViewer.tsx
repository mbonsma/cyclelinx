"use client";

import dynamic from "next/dynamic";

import React, { useContext, useEffect, useState } from "react";
import styled from "@emotion/styled";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { LatLngBounds, LatLng } from "leaflet";
import { format } from "d3-format";
import {
  ScaleLinear,
  ScaleOrdinal,
  ScaleQuantile,
  ScaleSymLog,
} from "d3-scale";
import { capitalize } from "@mui/material";
import { HamburgerMenu } from "@/components";
import {
  EXISTING_LANE_TYPE,
  isFeatureGroup,
  isGeoJSONFeature,
  PendingImprovements,
  ScoreResults,
  ScoreSet,
} from "@/lib/ts/types";
import { StaticDataContext } from "@/providers/StaticDataProvider";
import { formatNumber } from "@/lib/ts/util";

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

const formatPct = format(",.1%");

const buildValueTooltip = (
  metric: string,
  scores: ScoreSet,
  scoreType: keyof ScoreSet
) => {
  let pctChange = "";
  let color = "inherit";

  if (scoreType !== "diff") {
    pctChange = "";
  } else if (scores.original[metric] === 0 && scores.diff[metric] === 0) {
    pctChange = "(N/A)";
  } else if (scores.original[metric] === 0 && scores.diff[metric] !== 0) {
    pctChange = "(Inf)";
    color = "green";
  } else {
    pctChange = `(${formatPct(scores.diff[metric] / scores.original[metric])})`;
    color = "green";
  }

  return `<div><strong>${capitalize(metric)}:</strong>&nbsp;${formatNumber(
    scores[scoreType][metric]
  )}<span style="color:${color};">${pctChange}</span></div>`;
};

//todo: this should be an event layer, which I think react-leaflet supports specifically
//and is there a Layer component? So we can skip the useEffects?
const Handler: React.FC<{
  scoreScale?:
    | ScaleLinear<number, number>
    | ScaleQuantile<number, never>
    | ScaleSymLog<number, number, never>;
  metricTypeScale: ScaleOrdinal<string, string, never>;
  selectedMetric?: string;
  scores?: ScoreResults;
  scoreSet: keyof ScoreSet;
}> = ({ scoreScale, metricTypeScale, scores, scoreSet, selectedMetric }) => {
  const map = useMap();
  const { das } = useContext(StaticDataContext);

  // Add scores
  useEffect(() => {
    map.eachLayer((l) => {
      if (l.options.attribution === "DAs" && isFeatureGroup(l) && !!l.feature) {
        //we won't necessarily have a score for every DA when we calculate on the fly
        if (
          !!scores &&
          !!selectedMetric &&
          !!scoreScale &&
          isGeoJSONFeature(l.feature)
        ) {
          if (scores[l.feature.properties.id.toString()]) {
            const da_score_set =
              scores[l.feature.properties.id.toString()].scores;
            const da_scores = da_score_set[scoreSet];
            l.setStyle({
              fillColor: metricTypeScale(selectedMetric),
              fillOpacity: scoreScale(da_scores[selectedMetric]),
            });

            l.bindPopup(
              `<div><strong>DAUID:</strong>&nbsp;${l.feature.properties.DAUID}</div>` +
                metricTypeScale
                  .domain()
                  .map((v) => buildValueTooltip(v, da_score_set, scoreSet))
                  .join("\n")
            );
          }
        } else {
          l.setStyle({
            fillColor: "none",
            fillOpacity: 0,
          });
          l.unbindPopup();
        }
      }
    });
  }, [das, scores, selectedMetric, scoreScale, scoreSet, metricTypeScale, map]);

  return null;
};

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
  scoreScale,
  metricTypeScale,
  pendingImprovements,
  scores,
  scoreSet,
  selectedMetric,
  setPendingImprovements,
  visibleExistingLanes,
}) => {
  const [handlerVisible, setHandlerVisible] = useState(false);
  return (
    <StyledLeafletContainer
      bounds={new LatLngBounds(sw, ne)}
      scrollWheelZoom={true}
      // This prevents the handler and map from rendering at once, which causes lag
      // Instead, we render one at a time, and this seems like the best way to do it
      // given the circumstances.
      whenReady={() => setTimeout(() => setHandlerVisible(true), 500)}
    >
      <HamburgerMenu absolute />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a href='https://carto.com/attributions'>CARTO</a>"
      />
      {handlerVisible && (
        <>
          <DALayer />
          <ExistingLanesLayer visibleExistingLanes={visibleExistingLanes} />
          <ArterialLayer
            improvements={improvements}
            setPendingImprovements={setPendingImprovements}
            pendingImprovements={pendingImprovements}
          />
          <Handler
            scoreScale={scoreScale}
            metricTypeScale={metricTypeScale}
            scores={scores}
            scoreSet={scoreSet}
            selectedMetric={selectedMetric}
          />
          {/* <IntersectionFeatures /> */}
        </>
      )}
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
