import { format } from "d3-format";

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
