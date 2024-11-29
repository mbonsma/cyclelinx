"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Divider,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { GridModal } from ".";

interface HistoryModalProps {
  onClose: () => void;
  onSave: (title: string) => void;
  open: boolean;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  onClose,
  onSave,
  open,
}) => {
  const [mapName, setMapName] = useState("");

  const saveAndClose = () => {
    onSave(mapName);
    setMapName("");
    onClose();
  };

  return (
    <GridModal maxWidth="700px" onClose={onClose} open={open}>
      <Grid item>
        <Typography sx={{ marginTop: 0 }} variant="h4">
          Please give your map a title
        </Typography>
      </Grid>
      <Grid item width="100%">
        <Divider sx={{ margin: 2 }} />
      </Grid>
      <Grid item>
        <Box component="form" marginBottom={5}>
          <Grid
            alignItems="center"
            spacing={3}
            flexWrap="nowrap"
            direction="row"
            container
          >
            <Grid item>
              <TextField
                value={mapName}
                onChange={(e) => setMapName(e.currentTarget.value || "")}
                label="Map Name"
              />
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                disabled={!mapName}
                onClick={saveAndClose}
              >
                Save
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Grid>
    </GridModal>
  );
};

export default HistoryModal;
