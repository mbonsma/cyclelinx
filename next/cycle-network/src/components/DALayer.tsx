"use client";

import React, { useContext, useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { GeoJSON } from "leaflet";
import { Geometry } from "geojson";
import {
  ScaleLinear,
  ScaleOrdinal,
  ScaleQuantile,
  ScaleSymLog,
} from "d3-scale";
import { capitalize } from "@mui/material";
import { format } from "d3-format";
import { StaticDataContext } from "@/providers/StaticDataProvider";
import {
  isFeatureGroup,
  isGeoJSONFeature,
  ScoreResults,
  ScoreSet,
} from "@/lib/ts/types";
import { formatNumber } from "@/lib/ts/util";

interface DALayerProps {
  metricTypeScale: ScaleOrdinal<string, string, never>;
  scoreScale?:
    | ScaleLinear<number, number>
    | ScaleQuantile<number, never>
    | ScaleSymLog<number, number, never>;
  scores?: ScoreResults;
  scoreSet: keyof ScoreSet;
  selectedMetric?: string;
}

const formatPct = format(",.1%");

const buildValueTooltip = (
  metric: string,
  scores: ScoreSet,
  scoreType: keyof ScoreSet,
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
    scores[scoreType][metric],
  )}<span style="color:${color};">${pctChange}</span></div>`;
};

const DALayer: React.FC<DALayerProps> = ({
  metricTypeScale,
  scoreScale,
  scores,
  scoreSet,
  selectedMetric,
}) => {
  const [layer, setLayer] = useState<GeoJSON<any, Geometry>>();

  const { das } = useContext(StaticDataContext);

  const map = useMap();

  useEffect(() => {
    const layer = new GeoJSON(das!, {
      style: {
        stroke: false,
        fillColor: "none",
        fillOpacity: 0,
      },
      attribution: "DAs", //using this as a handle
    });

    setLayer(layer);
    map.addLayer(layer);
    //this needs only to fire once
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (layer) {
      layer.eachLayer((l) => {
        if (isFeatureGroup(l) && !!l.feature) {
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
                    .join("\n"),
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
    }
  }, [
    das,
    layer,
    scores,
    selectedMetric,
    scoreScale,
    scoreSet,
    metricTypeScale,
    map,
  ]);

  return null;
};

export default DALayer;
