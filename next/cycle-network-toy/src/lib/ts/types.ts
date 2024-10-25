import { MultiPolygon, LineString, GeoJsonObject } from "geojson";

export interface Budget {
  name: string;
  id: number;
}

export type ScaleType = "linear" | "quantile" | "log" | "bin";

interface ExistingLaneProperties {
  id: number;
  total_length: number;
  feature_type: "existing_lane";
  INFRA_HIGHORDER: string;
}

interface DAProperties {
  DAUID: number;
  id: number;
}

interface FeatureProperties {
  default_project_id?: number;
  id: number;
  total_length: number;
}

interface FeatureCollection<
  T extends GeoJsonObject,
  P extends Record<string, any>
> {
  crs: {
    properties: {
      name: string;
    };
    type: string;
  };
  features: {
    geometry: T;
    properties: P;
    type: "Feature";
  }[];
  type: "FeatureCollection";
}

export interface BudgetProjectMember {
  arterial_id: number;
  budget_id: number;
  project_id: number;
}

interface ImprovementFeatureProperties extends FeatureProperties {
  budget_project_id: number;
  feature_type: "improvement_feature";
}

interface ArterialFeatureProperties extends FeatureProperties {
  feature_type: "arterial";
  budget_project_ids: number[];
}

export type DAGeoJSON = FeatureCollection<MultiPolygon, DAProperties>;

export type ImprovementFeatureGeoJSON = FeatureCollection<
  LineString,
  ImprovementFeatureProperties
>;

export type ArterialFeatureGeoJSON = FeatureCollection<
  LineString,
  ArterialFeatureProperties
>;

export type ExistingLaneGeoJSON = FeatureCollection<
  LineString,
  ExistingLaneProperties
>;

export interface ScoreSet {
  budget: Record<string, number>;
  original: Record<string, number>;
  diff: Record<string, number>;
  bin: Record<string, number>;
}

export interface ScoreResults {
  [key: string]: {
    da: number;
    scores: ScoreSet;
  };
}

export interface Metric {
  id: number;
  name: string;
}
