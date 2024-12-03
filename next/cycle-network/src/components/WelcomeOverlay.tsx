"use client";

import React from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { ButtonLink, GridModal } from "@/components";
import { useIsMobile } from "@/hooks";
import { Close } from "@mui/icons-material";

interface WelcomeOverlayProps {
  onClose: () => void;
  open: boolean;
}

const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ onClose, open }) => {
  const isMobile = useIsMobile();

  return (
    <GridModal maxWidth="900px" open={open} onClose={onClose}>
      <Grid
        item
        component={Box}
        container
        justifyContent="flex-start"
        alignItems="center"
        direction="column"
        spacing={4}
      >
        <Grid item>
          <Typography variant="h2">Welcome to Cyclelinx</Typography>
        </Grid>
        {isMobile ? (
          <Grid item>
            <Alert color="error">
              <AlertTitle>
                Please Note that Cyclelinx is best viewed in a desktop
                environment.
              </AlertTitle>
            </Alert>
          </Grid>
        ) : (
          <Grid item width="100%">
            <Divider />
          </Grid>
        )}
        <Grid item>
          <Typography variant="h6">
            Cyclelinx is an interactive map of Toronto&apos;s cycling routes. It
            also allows you to view optimal plans for new cycling infrastructure
            as calcuted by specialists at the University of Toronto (
            <Link href="/about">read more here</Link>
            ). You can also edit the map to add routes and track accessibility.
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="h6">
            Click <Link href="#">here</Link> to view the full tutorial.
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="h6">
            Or <ButtonLink onClick={onClose}>close</ButtonLink> this message to
            get started.
          </Typography>
        </Grid>
      </Grid>
    </GridModal>
  );
};

export default WelcomeOverlay;
