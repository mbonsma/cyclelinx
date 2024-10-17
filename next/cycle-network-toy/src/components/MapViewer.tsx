"use client";

import React, { useContext, useEffect, useState } from "react";
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
import {
  ExistingLaneGeoJSON,
  ImprovementFeatureGeoJSON,
  ScoreResults,
  ScoreSet,
} from "@/lib/ts/types";
import {
  ScaleLinear,
  ScaleOrdinal,
  ScaleQuantile,
  ScaleSymLog,
} from "d3-scale";
import { DAContext } from "@/providers/DAContextProvider";
import { format } from "d3-format";
import { useTheme } from "@mui/material";

const formatPct = format(",.1%");

const buildValueTooltip = (
  metric: string,
  scores: ScoreSet,
  score_type: keyof ScoreSet
) => {
  const diff = scores.diff[metric] / scores.original[metric];

  const pctChange =
    score_type === "diff" ? (diff ? ` (${formatPct(diff)})` : " (N/A)") : "";

  return `<div><strong>${
    metric.slice(0, 1).toUpperCase() + metric.slice(1)
  }:</strong>&nbsp;${formatDigit(scores[score_type][metric])}${pctChange}`;
};

const Handler: React.FC<{
  existingLanes?: ExistingLaneGeoJSON;
  scoreScale?:
    | ScaleLinear<number, number>
    | ScaleQuantile<number, never>
    | ScaleSymLog<number, number, never>;
  metricTypeScale: ScaleOrdinal<string, string, never>;
  improvements?: ImprovementFeatureGeoJSON;
  selectedMetric?: string;
  scores?: ScoreResults;
  scoreSet: keyof ScoreSet;
  visibleExistingLanes: EXISTING_LANE_TYPE[];
}> = ({
  existingLanes,
  scoreScale,
  metricTypeScale,
  improvements,
  scores,
  scoreSet,
  selectedMetric,
  visibleExistingLanes,
}) => {
  const [dasSet, setDasSet] = useState(false);
  const map = useMap();
  const das = useContext(DAContext);
  const theme = useTheme();

  useEffect(() => {
    map.on("click", (e) => {
      console.log(e);
      const coord = e.latlng;
      const lat = coord.lat;
      const lng = coord.lng;
      console.log(
        "You clicked the map at latitude: " + lat + " and longitude: " + lng
      );
    });
  }, [map]);

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
    /* Add the propsed new lanes */
    if (improvements) {
      const layer = new LGeoJSON(improvements as GeoJsonObject, {
        style: {
          color: theme.palette.projectColor,
        },
      });

      map.eachLayer((l) => {
        //todo: add click handler to remove
        //todo: we can no longer count on feature_type
        //  improvement features have to be labeled on the server ad-hoc, since it can be any arterial
        //  so maybe reinstate this property conditionally for this featurecollection
        if (l?.feature?.properties.feature_type == "improvement_feature") {
          map.removeLayer(l);
        }
      });
      map.addLayer(layer);
    }
  }, [improvements, map, theme]);

  return null;
};

//GTA, more or less
const c1 = new LatLng(43.72, -79.21);
const c2 = new LatLng(43.61, -79.45);

const MapViewer: React.FC<{
  existingLanes?: ExistingLaneGeoJSON;
  improvements?: ImprovementFeatureGeoJSON;
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
  improvements,
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
      improvements={improvements}
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
