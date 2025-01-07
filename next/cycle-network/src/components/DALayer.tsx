"use client";

import React, { useContext, useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { GeoJSON } from "leaflet";
import { Geometry } from "geojson";
import { StaticDataContext } from "@/providers/StaticDataProvider";

const DALayer: React.FC = () => {
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

  return null;
};

export default DALayer;
