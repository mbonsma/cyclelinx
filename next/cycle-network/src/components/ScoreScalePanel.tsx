import React from "react";
import Link from "next/link";
import { ScaleLinear, ScaleQuantile, ScaleSymLog } from "d3-scale";
import {
  Collapse,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { ScoreSet } from "@/lib/ts/types";

interface ScoreScalePanelProps {
  measuresVisible: boolean;
  scoreScale?:
    | ScaleLinear<number, number, never>
    | ScaleSymLog<number, number, never>
    | ScaleQuantile<number, never>;
  scoreSetType: keyof ScoreSet;
  selectedMetric?: string;
  setMeasuresVisible: (set: boolean) => void;
  setScoreSetType: (ss: keyof ScoreSet) => void;
}

const ScoreScalePanel: React.FC<ScoreScalePanelProps> = ({
  measuresVisible,
  scoreScale,
  scoreSetType,
  selectedMetric,
  setMeasuresVisible,
  setScoreSetType,
}) =>
  scoreScale ? (
    <>
      <Link href="#" onClick={() => setMeasuresVisible(!measuresVisible)}>
        <Typography variant="caption">
          {`${measuresVisible ? "Hide" : "Show"}`} measures
        </Typography>
      </Link>
      <Collapse in={measuresVisible}>
        <FormControl fullWidth>
          <RadioGroup>
            <FormControlLabel
              control={<Radio />}
              label="Change over Present"
              onChange={() => setScoreSetType("diff")}
              checked={scoreSetType === "diff"}
            />
            {selectedMetric !== "greenspace" && (
              <FormControlLabel
                control={<Radio />}
                label="Projected Total"
                onChange={() => setScoreSetType("budget")}
                checked={scoreSetType === "budget"}
              />
            )}
            {selectedMetric == "greenspace" && (
              <FormControlLabel
                control={<Radio />}
                label="Projected Total"
                onChange={() => setScoreSetType("bin")}
                checked={scoreSetType === "bin"}
              />
            )}
          </RadioGroup>
        </FormControl>
      </Collapse>
    </>
  ) : null;

export default ScoreScalePanel;
