import { range } from "d3-array";
import { rgb } from "d3-color";
import { ScaleLinear } from "d3-scale";
import { select } from "d3-selection";
import React, { useRef, useLayoutEffect } from "react";

interface LegendGradientProps {
  color: string;
  height: number;
  scale: ScaleLinear<number, number>;
  width: number;
}

const LegendGradient: React.FC<LegendGradientProps> = ({
  color,
  height,
  scale,
  width,
}) => {
  const selector = useRef(
    `legend-gradient-${Math.random().toString(36).slice(3)}`
  );

  useLayoutEffect(() => {
    renderLinearLegend(`.${selector.current}`, scale, height, width, color);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale]);

  return <span className={selector.current} />;
};

const renderLinearLegend = (
  selector: string,
  scale: ScaleLinear<number, number>,
  height: number,
  width: number,
  color: string
) => {
  const gradientId = `legendGradient-${Math.random().toString(36).slice(3)}`;

  const svg = select(selector)
    .selectAll("svg")
    .data([1], Math.random)
    .join("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  svg
    .append("defs")
    .append("linearGradient")
    .attr("id", gradientId)
    .selectAll("stop")
    .data(range(0, 1, 0.01), Math.random)
    .join("stop")
    .attr("offset", (d) => `${d * 100}%`)
    .attr("stop-color", (d) => {
      const scaleColor = rgb(color);
      //todo: I shouldn't need to provide the range here...?
      scaleColor.opacity = scale.interpolate()(
        scale.range()[0],
        scale.range()[1]
      )(d);
      return scaleColor.toString();
    });

  svg
    .selectAll("rect")
    .data([1], Math.random)
    .join("rect")
    .attr("height", height)
    .attr("width", width)
    .attr("fill", `url(#${gradientId})`);
};

export default LegendGradient;
