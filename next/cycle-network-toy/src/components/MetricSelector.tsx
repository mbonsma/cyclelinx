import { Metric } from "@/lib/ts/types";
import {
  capitalize,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import React from "react";

interface MetricSelectorProps {
  metrics?: Metric[];
  setMetric: (name: string) => void;
}

const MetricSelector: React.FC<MetricSelectorProps> = ({
  metrics,
  setMetric,
}) =>
  metrics ? (
    <FormControl fullWidth>
      <FormLabel id="radio-group-legend">Metric</FormLabel>
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
        />
        {metrics.map((m) => (
          <FormControlLabel
            key={m.id}
            control={<Radio />}
            onChange={() => setMetric(m.name)}
            label={capitalize(m.name)}
            value={m.name}
          />
        ))}
      </RadioGroup>
    </FormControl>
  ) : null;

export default MetricSelector;
