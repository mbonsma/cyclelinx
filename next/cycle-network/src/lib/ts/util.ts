import { format } from "d3-format";
import { EXISTING_LANE_TYPE } from "./types";
import { scaleOrdinal } from "d3-scale";
import {
  schemePuBuGn,
  schemePurples,
  schemeSet2,
  schemeYlOrBr,
} from "d3-scale-chromatic";

/**
 * Round number and return
 *
 * @param {number} value
 * @param {number} sd significant digits
 * @returns {number}
 */
export const roundDigit = (value: number, sd?: number): number => {
  let fmt = "";
  if (!value) {
    return value;
  } else if (sd) {
    fmt = `.${sd}~r`;
  } else if (sd === undefined) {
    //for smaller numbers, use 3 sig digits, stripping trailing zeroes
    if (Math.abs(value) < 10) {
      fmt = `.3~r`;
      //for larger, round to 2 decimal places, stripping trailing zeroes
    } else {
      fmt = `.2~f`;
    }
  }
  let res: number;
  try {
    //for negative numbers, replace d3's dash with javascript's hyphen
    res = +format(fmt)(value).replace("−", "-");
    return res;
  } catch (e) {
    //we don't want the app to blow up if this function can't handle something
    //eslint-disable-next-line no-console
    console.error(e);
    return value;
  }
};

/**
 * Convert number to string, adding commas to numbers greater than a thousand,
 *     otherwise use decimal notation, varying significant digits by size
 *
 * @param {number} value
 * @returns {string}
 */
export const formatNumber = (value: number, d?: number) => {
  const rounded = roundDigit(value, d);
  if (rounded > 1000) {
    return format(",d")(rounded);
  } else return rounded;
};

const existingLaneTypes: EXISTING_LANE_TYPE[] = [
  "Multi-Use Trail",
  "Cycle Track",
  "Park Road",
  "Bike Lane",
  "Signed Route", // high stress
  "Sharrows", // high stress
];

export const existingScale = scaleOrdinal(
  existingLaneTypes,
  schemePurples[6].slice(2).concat([schemeYlOrBr[8][5], schemeYlOrBr[8][6]])
);

export const EXISTING_LANE_NAME_MAP: Record<string, EXISTING_LANE_TYPE> = {
  ["Multi-Use Trail"]: "Multi-Use Trail",
  ["Multi-Use Trail - Entrance"]: "Multi-Use Trail",
  ["Multi-Use Trail - Connector"]: "Multi-Use Trail",
  ["Multi-Use Trail - Boulevard"]: "Multi-Use Trail",
  ["Multi-Use Trail - Existing Connector"]: "Multi-Use Trail",
  ["Cycle Track"]: "Cycle Track",
  ["Bi-Directional Cycle Track"]: "Cycle Track",
  ["Cycle Track - Contraflow"]: "Cycle Track",
  ["Park Road"]: "Park Road",
  ["Bike Lane"]: "Bike Lane",
  ["Bike Lane - Buffered"]: "Bike Lane",
  ["Bike Lane - Contraflow"]: "Bike Lane",
  ["Signed Route (No Pavement Markings)"]: "Signed Route",
  ["Sharrows"]: "Sharrows",
  ["Sharrows - Wayfinding"]: "Sharrows",
  ["Sharrows - Arterial"]: "Sharrows",
  ["Sharrows - Arterial - Connector"]: "Sharrows",
};
