import {
  EXISTING_LANE_NAME_MAP,
  EXISTING_LANE_TYPE,
  existingScale,
} from "@/app/page";
import {
  Button,
  Checkbox,
  checkboxClasses,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
} from "@mui/material";
import React from "react";

interface ExistingLaneControlsProps {
  setVisibleExistingLanes: (lanes: EXISTING_LANE_TYPE[]) => void;
  visibleExistingLanes: EXISTING_LANE_TYPE[];
}

const ExistingLaneControls: React.FC<ExistingLaneControlsProps> = ({
  setVisibleExistingLanes,
  visibleExistingLanes,
}) => (
  <FormControl fullWidth>
    <FormLabel id="checkbox-group-legend">
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12}>
          Existing Lanes
        </Grid>
        <Grid item>
          <Button
            onClick={() =>
              setVisibleExistingLanes(Object.values(EXISTING_LANE_NAME_MAP))
            }
            size="small"
            variant="text"
          >
            Show all
          </Button>
        </Grid>
        <Grid item>
          <Button
            onClick={() => setVisibleExistingLanes([])}
            size="small"
            variant="text"
          >
            Hide all
          </Button>
        </Grid>
      </Grid>
    </FormLabel>
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

export default ExistingLaneControls;
