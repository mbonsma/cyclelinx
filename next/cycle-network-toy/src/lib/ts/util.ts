import { format } from "d3-format";
import { EXISTING_LANE_TYPE } from "./types";
import { scaleOrdinal } from "d3-scale";
import { schemeSet2 } from "d3-scale-chromatic";

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
export const formatDigit = (value: number, d?: number) => {
  const rounded = roundDigit(value, d);
  if (rounded > 1000) {
    return format(",d")(rounded);
  } else return rounded;
};

const existingLaneTypes: EXISTING_LANE_TYPE[] = [
  "Multi-Use Trail",
  "Sharrows",
  "Cycle Track",
  "Park Road",
  "Signed Route",
  "Multi-Use Trail",
  "Bike Lane",
];

export const existingScale = scaleOrdinal(
  existingLaneTypes,
  schemeSet2.slice(0, existingLaneTypes.length)
);

export const EXISTING_LANE_NAME_MAP: Record<string, EXISTING_LANE_TYPE> = {
  ["Sharrows - Wayfinding"]: "Sharrows",
  ["Multi-Use Trail"]: "Multi-Use Trail",
  ["Multi-Use Trail - Entrance"]: "Multi-Use Trail",
  ["Cycle Track"]: "Cycle Track",
  ["Park Road"]: "Park Road",
  ["Sharrows"]: "Sharrows",
  ["Bike Lane"]: "Bike Lane",
  ["Bi-Directional Cycle Track"]: "Cycle Track",
  ["Signed Route (No Pavement Markings)"]:
    "Signed Route (No Pavement Markings)",
  ["Bike Lane - Buffered"]: "Bike Lane",
  ["Multi-Use Trail - Connector"]: "Multi-Use Trail",
  ["Multi-Use Trail - Boulevard"]: "Multi-Use Trail",
  ["Multi-Use Trail - Existing Connector"]: "Multi-Use Trail",
  ["Bike Lane - Contraflow"]: "Bike Lane",
  ["Sharrows - Arterial"]: "Sharrows",
  ["Sharrows - Arterial - Connector"]: "Sharrows",
  ["Cycle Track - Contraflow"]: "Cycle Track",
};
