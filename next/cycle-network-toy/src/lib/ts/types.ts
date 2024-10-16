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

interface FeatureProperties {
  ADDRESS_L: string;
  ADDRESS_R: string;
  CP_TYPE: string;
  default_project_id: number;
  DIR_CODE_D: string;
  FCODE: number;
  FCODE_DESC: string;
  feature_type: string;
  FNODE: number;
  GEO_ID: number;
  geometry: string;
  HINUML: number;
  HINUMR: number;
  JURIS_CODE: string;
  length_in_: number;
  LFN_ID: number;
  LF_NAME: string;
  LONUMR: number;
  LONUML: number;
  NBRLANES_2: number;
  OBJECTID: number;
  OE_FLAG_L: string;
  OE_FLAG_R: string;
  ONE_WAY_DI: number;
  Shape_Leng: number;
  SPEED: number;
  TNODE: number;
  U500_20: string;
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

export type DAGeoJSON = FeatureCollection<MultiPolygon, DAProperties>;

export type BaseFeatureGeoJSON = FeatureCollection<
  LineString,
  FeatureProperties
>;

interface ImprovementFeatureProperties extends FeatureProperties {
  budget_project_id: number;
}

export type ImprovementFeatureGeoJSON = FeatureCollection<
  LineString,
  ImprovementFeatureProperties
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
