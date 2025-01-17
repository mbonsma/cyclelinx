"use client";

import React, { useContext, useEffect } from "react";
import { useMap } from "react-leaflet";
import { GeoJSON as LGeoJSON, CircleMarker } from "leaflet";
import { StaticDataContext } from "@/providers/StaticDataProvider";

const IntersectionLayer: React.FC = () => {
  const { intersections } = useContext(StaticDataContext);

  const map = useMap();

  useEffect(() => {
    if (map && intersections) {
      map.addLayer(
        new LGeoJSON(intersections, {
          pointToLayer: (_, latlng) => {
            return new CircleMarker(latlng, {
              radius: 2,
              weight: 1,
              opacity: 0.3,
              fillOpacity: 0.3,
              className: "intersection",
              color: "blue",
              stroke: true,
              fillColor: "blue",
            });
          },
          attribution: "intersection", //using this as a handle
          onEachFeature: (f, l) => {
            l.on("click", (e) => {
              alert(
                `You clicked on an intersection with id ${e.target.feature.properties.INTERSECTION_ID}`,
              );
            });
            l.bindTooltip(`<div>${f.properties.INTERSECTION_ID}</div>`);
          },
        }),
      );
    }
  }, [map, intersections]);

  return null;
};

export default IntersectionLayer;
