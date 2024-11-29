"use client";

import React from "react";
import { Box, Grid, IconButton, Modal, Paper } from "@mui/material";
import { Close } from "@mui/icons-material";

interface GridModalProps {
  children: React.ReactNode;
  maxWidth: string;
  onClose: () => void;
  open: boolean;
}

const GridModal: React.FC<GridModalProps> = ({
  children,
  maxWidth,
  onClose,
  open,
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Grid
        alignItems="center"
        container
        item
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          maxWidth: { maxWidth },
          borderRadius: 5,
          border: (theme) => `thin solid ${theme.palette.grey[300]}`,
          overflow: "auto",
          ":focus, :focus-visible": {
            outline: "none",
          },
          padding: 3,
        }}
        component={Paper}
        direction="column"
        flexWrap="nowrap"
      >
        <Grid item alignSelf="flex-end">
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Grid>
        <Grid
          item
          component={Box}
          borderRadius={5}
          container
          justifyContent="flex-start"
          alignItems="center"
          direction="column"
          spacing={4}
        >
          {children}
        </Grid>
      </Grid>
    </Modal>
  );
};

export default GridModal;
