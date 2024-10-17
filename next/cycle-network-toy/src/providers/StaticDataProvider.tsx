"use client";

import { DAGeoJSON, ExistingLaneGeoJSON } from "@/lib/ts/types";
import { createContext } from "react";

interface StaticDataProps {
  das: DAGeoJSON | null;
  existingLanes: ExistingLaneGeoJSON | null;
}

export const StaticDataContext = createContext<StaticDataProps>({
  das: null,
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
