import React from "react";
import {
  Collapse,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { ScaleType } from "@/lib/ts/types";

interface ScoreScaleSelectorProps {
  scaleType: ScaleType;
  scaleTypeVisible: boolean;
  setScaleType: (v: ScaleType) => void;
  setScaleTypeVisible: (v: boolean) => void;
}

const ScoreScaleSelector: React.FC<ScoreScaleSelectorProps> = ({
  scaleType,
  scaleTypeVisible,
  setScaleType,
  setScaleTypeVisible,
}) => (
  <>
    <Link href="#" onClick={() => setScaleTypeVisible(!scaleTypeVisible)}>
      <Typography variant="caption">
        {`${scaleTypeVisible ? "Hide" : "Show"}`} scale types
      </Typography>
    </Link>
    <Collapse in={scaleTypeVisible}>
      <FormControl fullWidth>
        <RadioGroup>
          {(["linear", "log", "quantile"] as ScaleType[]).map((t) => {
            return (
              <FormControlLabel
                key={t}
                control={<Radio />}
                label={t}
                onChange={() => setScaleType(t)}
                checked={scaleType == t}
              />
            );
          })}
        </RadioGroup>
      </FormControl>
    </Collapse>
  </>
);

export default ScoreScaleSelector;
