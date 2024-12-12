"use client";

import React, { createContext } from "react";
import {
  ArterialFeatureGeoJSON,
  DAGeoJSON,
  DefaultScores,
  ExistingLaneGeoJSON,
  IntersectionFeatureGeoJSON,
} from "@/lib/ts/types";

interface StaticDataProps {
  arterials: ArterialFeatureGeoJSON | null;
  das: DAGeoJSON | null;
  defaultScores: DefaultScores | null;
  existingLanes: ExistingLaneGeoJSON | null;
  intersections: IntersectionFeatureGeoJSON | null;
}

export const StaticDataContext = createContext<StaticDataProps>({
  arterials: null,
  das: null,
  defaultScores: null,
  existingLanes: null,
  intersections: null,
});

interface StaticDataProviderProps {
  value: StaticDataProps;
  children: React.ReactNode;
}

const StaticDataProvider: React.FC<StaticDataProviderProps> = ({
  children,
  value,
}) => {
  return (
    <StaticDataContext.Provider value={value}>
      {children}
    </StaticDataContext.Provider>
  );
};

export default StaticDataProvider;
