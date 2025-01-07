"use client";

import React, { useContext, useEffect } from "react";
import { useMap } from "react-leaflet";
import { GeoJSON } from "leaflet";
import { EXISTING_LANE_TYPE } from "@/lib/ts/types";
import { StaticDataContext } from "@/providers/StaticDataProvider";
import { EXISTING_LANE_NAME_MAP, existingScale } from "@/lib/ts/util";

interface ExistingLanesLayerProps {
  visibleExistingLanes: EXISTING_LANE_TYPE[];
}

const ExistingLanesLayer: React.FC<ExistingLanesLayerProps> = ({
  visibleExistingLanes,
}) => {
  const { existingLanes } = useContext(StaticDataContext);

  const map = useMap();

  useEffect(() => {
    map.addLayer(
      new GeoJSON(existingLanes!, {
        style: {
          stroke: false,
          fillColor: "none",
          fillOpacity: 0,
        },
        attribution: "existingLanes",
      })
    );
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    map.eachLayer((l: any) => {
      const layerProps = l?.feature?.properties;
      if (
        !!layerProps?.INFRA_HIGHORDER &&
        l?.options?.attribution === "existingLanes"
      ) {
        if (
          !visibleExistingLanes.includes(
            EXISTING_LANE_NAME_MAP[layerProps.INFRA_HIGHORDER]
          )
        ) {
          l.setStyle({
            stroke: false,
            fillColor: "none",
            fillOpacity: 0,
          });
        } else {
          l.setStyle({
            stroke: true,
            fillColor: existingScale(
              EXISTING_LANE_NAME_MAP[layerProps.INFRA_HIGHORDER]
            ),
            color: existingScale(
              EXISTING_LANE_NAME_MAP[layerProps.INFRA_HIGHORDER]
            ),
            fillOpacity: 0.75,
            opacity: 1,
          });
        }
      }
    });
  }, [visibleExistingLanes, map]);

  return null;
};

export default ExistingLanesLayer;
