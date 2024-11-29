import React, { useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Checkbox,
  checkboxClasses,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
} from "@mui/material";
import { EXISTING_LANE_TYPE } from "@/lib/ts/types";
import { EXISTING_LANE_NAME_MAP, existingScale } from "@/lib/ts/util";

interface ExistingLaneControlsProps {
  setVisibleExistingLanes: (lanes: EXISTING_LANE_TYPE[]) => void;
  visibleExistingLanes: EXISTING_LANE_TYPE[];
}

const ExistingLaneControls: React.FC<ExistingLaneControlsProps> = ({
  setVisibleExistingLanes,
  visibleExistingLanes,
}) => {
  const atLeastOneBoxTicked = useMemo(() => {
    return visibleExistingLanes.length > 0;
  }, [visibleExistingLanes]);

  const toggleText = useMemo(() => {
    return atLeastOneBoxTicked ? "Hide All" : "Show All";
  }, [atLeastOneBoxTicked]);

  const toggleTicked = useCallback(() => {
    return atLeastOneBoxTicked
      ? setVisibleExistingLanes([])
      : setVisibleExistingLanes(Object.values(EXISTING_LANE_NAME_MAP));
  }, [setVisibleExistingLanes, atLeastOneBoxTicked]);

  return (
    <FormControl fullWidth>
      <FormGroup>
        <Box display="flex" justifyContent="flex-start">
          <Button onClick={toggleTicked} size="small" variant="text">
            {toggleText}
          </Button>
        </Box>
      </FormGroup>

      <FormGroup aria-labelledby="checkbox-group-legend">
        {Array.from(new Set(Object.values(EXISTING_LANE_NAME_MAP))).map(
          (m: EXISTING_LANE_TYPE) => (
            <FormControlLabel
              key={m}
              control={
                <Checkbox
                  sx={{
                    [`&, &.${checkboxClasses.checked}`]: {
                      color: existingScale(m),
                    },
                  }}
                />
              }
              onChange={() =>
                visibleExistingLanes.includes(m)
                  ? setVisibleExistingLanes(
                      visibleExistingLanes.filter((l) => l !== m)
                    )
                  : setVisibleExistingLanes(visibleExistingLanes.concat(m))
              }
              label={m}
              value={m}
              checked={visibleExistingLanes.includes(m)}
            />
          )
        )}
      </FormGroup>
    </FormControl>
  );
};

export default ExistingLaneControls;
