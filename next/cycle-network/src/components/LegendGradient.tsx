"use client";

import React, { useRef, useLayoutEffect } from "react";
import { Box } from "@mui/material";
import { range } from "d3-array";
import { rgb } from "d3-color";
import { select } from "d3-selection";
import { useHandleResize } from "@/hooks";

interface LegendGradientProps {
  color: string;
  height: number;
  range: [number, number]; //opacity range
}

const LegendGradient: React.FC<LegendGradientProps> = ({
  color,
  height,
  range,
}) => {
  const selector = useRef(
    `legend-gradient-${Math.random().toString(36).slice(3)}`
  );

  const containerRef = useRef<HTMLSpanElement>(null);

  const w = useHandleResize(containerRef);

  useLayoutEffect(() => {
    if (w) {
      renderLinearLegend(color, height, range, `.${selector.current}`, w);
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, color]);

  return (
    <Box
      sx={{ display: "flex", flexGrow: 1, width: "100%" }}
      ref={containerRef}
      className={selector.current}
    />
  );
};

const renderLinearLegend = (
  color: string,
  height: number,
  opacityRange: [number, number],
  selector: string,
  width: number | string
) => {
  const gradientId = `legendGradient-${Math.random().toString(36).slice(3)}`;

  const svg = select(selector)
    .selectAll("svg")
    .data([1], Math.random)
    .join("svg")
    .style("flex-grow", 1)
    .attr("viewBox", `0 0 ${width} ${height}`);

  svg
    .append("defs")
    .append("linearGradient")
    .attr("id", gradientId)
    .selectAll("stop")
    .data(range(opacityRange[0], opacityRange[1], 0.01), Math.random)
    .join("stop")
    .attr("offset", (d) => `${d * 100}%`)
    .attr("stop-color", (d) => {
      const scaleColor = rgb(color);
      scaleColor.opacity = d;
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
