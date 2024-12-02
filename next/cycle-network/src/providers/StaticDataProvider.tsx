"use client";

import {
  ArterialFeatureGeoJSON,
  DAGeoJSON,
  DefaultScores,
  ExistingLaneGeoJSON,
} from "@/lib/ts/types";
import { createContext } from "react";

interface StaticDataProps {
  arterials: ArterialFeatureGeoJSON | null;
  das: DAGeoJSON | null;
  defaultScores: DefaultScores | null;
  existingLanes: ExistingLaneGeoJSON | null;
}

export const StaticDataContext = createContext<StaticDataProps>({
  arterials: null,
  das: null,
  defaultScores: null,
  existingLanes: null,
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
