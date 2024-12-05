import geojson, {
  MultiPolygon,
  LineString,
  GeoJsonObject,
  GeometryObject,
  Feature,
  MultiPoint,
  GeometryCollection,
} from "geojson";
import { FeatureGroup, Layer } from "leaflet";

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
  GEO_ID: number;
  budget_project_ids: number[];
}

export interface ArterialFeaturePropertiesExport {
  GEO_ID: number;
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

export type ArterialFeatureGeoJSONExport = FeatureCollection<
  LineString,
  ArterialFeaturePropertiesExport
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

export interface PendingImprovements {
  toAdd: number[];
  toRemove: number[];
}

export type EXISTING_LANE_TYPE =
  | "Bike Lane"
  | "Cycle Track"
  | "Multi-Use Trail"
  | "Park Road"
  | "Sharrows"
  | "Signed Route";

export const isFeatureGroup = (
  arg: Layer | FeatureGroup
): arg is FeatureGroup => !!(arg as FeatureGroup).setStyle;

export const isGeoJSONFeature = <P extends Record<string, any>>(
  arg:
    | geojson.FeatureCollection<GeometryObject, P>
    | Feature<MultiPoint, P>
    | GeometryCollection
    | undefined
): arg is Feature<MultiPoint, P> =>
  !!(arg as Feature<MultiPoint, P>).type &&
  !!(arg as Feature<MultiPoint, P>).properties;

export interface HistoryItem {
  improvements: number[];
  name: string;
  scores: ScoreResults;
}

export interface DefaultScore {
  da: number;
  [metric: string]: number;
}

export type DefaultScores = Record<string, DefaultScore>;
