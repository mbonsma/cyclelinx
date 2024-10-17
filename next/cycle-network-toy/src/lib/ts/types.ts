import { MultiPolygon, LineString, GeoJsonObject } from "geojson";

export interface Budget {
  name: string;
  id: number;
}

export type ScaleType = "linear" | "quantile" | "log" | "bin";

interface ExistingLaneProperties {
  id: number;
  OBJECTID: number;
  SEGMENT_ID: number;
  INSTALLED: number;
  UPGRADED: number;
  PRE_AMALGAMATION: string;
  STREET_NAME: string;
  FROM_STREET: string;
  TO_STREET: string;
  ROADCLASS: string;
  CNPCLASS: string;
  SURFACE: string;
  OWNER: string;
  DIR_LOWORDER: string;
  INFRA_LOWORDER: string;
  SEPA_LOWORDER: string;
  SEPB_LOWORDER: string;
  ORIG_LOWORDER_INFRA: string;
  DIR_HIGHORDER: string;
  INFRA_HIGHORDER: string;
  SEPA_HIGHORDER: string;
  SEPB_HIGHORDER: string;
  ORIG_HIGHORDER: string;
  BYLAWED: string;
  EDITOR: string;
  LAST_EDIT_DATE: string;
  UPGRADE_DESCRIPTION: string;
  CONVERTED: string;
  total_length: number;
}

interface DAProperties {
  DAUID: number;
  id: number;
}

interface FeatureProperties {
  default_project_id: number;
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

interface ImprovementFeatureProperties extends FeatureProperties {
  budget_project_id: number;
  feature_type: "improvement_feature";
}

interface ArterialFeatureProperties extends FeatureProperties {
  feature_type: "arterial";
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
