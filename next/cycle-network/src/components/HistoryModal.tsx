"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { HistoryItem } from "@/lib/ts/types";
import { GridModal } from ".";

interface HistoryModalProps {
  error?: string;
  history: HistoryItem[];
  onClose: () => void;
  onSave: (title: string) => void;
  open: boolean;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  history,
  onClose,
  onSave,
  open,
}) => {
  const [mapName, setMapName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (error) {
      setError("");
    }
  }, [mapName]);

  const saveAndClose = () => {
    if (history.map((h) => h.name).includes(mapName)) {
      return setError("Name already taken!");
    }
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
        <Box
          marginBottom={5}
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (mapName) {
              saveAndClose();
            }
          }}
        >
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
                error={!!error}
                helperText={error}
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
