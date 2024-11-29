"use client";

import React, { useState } from "react";
import { Collapse, Grid, IconButton, Typography } from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";

interface CollapsibleSectionProps {
  children: React.ReactNode;
  defaultOpen: boolean;
  label: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  children,
  defaultOpen,
  label,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Grid container direction="column" wrap="nowrap">
      <Grid item container justifyContent="space-between">
        <Grid>
          <Typography variant="h6">{label}</Typography>
        </Grid>
        <Grid>
          <IconButton onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </Grid>
      </Grid>
      <Collapse in={open}>{children}</Collapse>
      {!open && <Typography marginLeft={2}>...</Typography>}
    </Grid>
  );
};

export default CollapsibleSection;
