"use client";

import { DAGeoJSON } from "@/lib/ts/types";
import { createContext } from "react";

export const DAContext = createContext<DAGeoJSON | null>(null);

interface DADataProps {
  das: DAGeoJSON | null;
  children: React.ReactNode;
}

const DAContextProvider: React.FC<DADataProps> = ({ children, das }) => {
  return <DAContext.Provider value={das}>{children}</DAContext.Provider>;
};

export default DAContextProvider;
