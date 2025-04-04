import React from "react";
import {
  capitalize,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { Metric } from "@/lib/ts/types";

interface MetricSelectorProps {
  metrics?: Metric[];
  setMetric: (name: string) => void;
  selectedMetric: string;
}

const MetricSelector: React.FC<MetricSelectorProps> = ({
  metrics,
  selectedMetric,
  setMetric,
}) =>
  metrics ? (
    <FormControl fullWidth>
      <RadioGroup
        aria-labelledby="radio-group-legend"
        defaultValue={metrics[0]}
        name="radio-buttons-group"
      >
        <FormControlLabel
          control={<Radio />}
          onChange={() => setMetric("")}
          label={"None"}
          value={""}
          checked={selectedMetric === ""}
        />
        {metrics.map((m) => (
          <FormControlLabel
            key={m.id}
            control={<Radio />}
            onChange={() => setMetric(m.name)}
            label={capitalize(m.name)}
            value={m.name}
            checked={selectedMetric === m.name}
          />
        ))}
      </RadioGroup>
    </FormControl>
  ) : null;

export default MetricSelector;
