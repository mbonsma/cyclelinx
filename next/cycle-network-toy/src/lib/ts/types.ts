import { MultiPolygon, Position, GeoJsonObject } from "geojson";

export interface Budget {
  name: string;
  id: number;
}

interface Score {}

interface DA {}

interface Metric {}

// type is geojson[multipolygon]

interface MultiPolygonFeatures<T extends Record<string, any>>
  extends MultiPolygon {
  properties: T;
}

interface DAProperties {
  ADAUID: number;
  CCSNAME: string;
  CCSUID: number;
  CDNAME: string;
  CDTYPE: string;
  CDUID: number;
  CMANAME: string;
  CMAPUID: number;
  CMATYPE: string;
  CMAUID: number;
  CSDNAME: string;
  CSDTYPE: string;
  CSDUID: number;
  CTNAME: number;
  CTUID: number;
  DAUID: number;
  DAUID_int: number;
  ERNAME: string;
  ERUID: number;
  PRNAME: string;
  PRUID: number;
  SACCODE: number;
  SACTYPE: string;
  Shape_Area: number;
  Shape_Leng: number;
  id: number;
}

interface GeoJSONC<T extends GeoJsonObject> {
  crs: {
    properties: {
      name: string;
    };
    type: string;
  };
  features: T[];
  type: string;
}

export type DAGeoJSON = GeoJSONC<MultiPolygonFeatures<DAProperties>>;
export interface ScoreResponse {
  da: DAGeoJSON;
  metric: string;
  score: number;
}

export interface ScoreSet {
  budget: Record<string, number>;
  default: Record<string, number>;
  diff: Record<string, number>;
}

export interface GroupedScoredDA {
  da: DAGeoJSON;
  scores: ScoreSet;
}
