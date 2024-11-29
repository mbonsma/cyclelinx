"use client";

import React, { useEffect } from "react";
import {
  Alert,
  AlertTitle,
  Backdrop,
  Box,
  Divider,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { ButtonLink } from "@/components";
import { useIsMobile } from "@/hooks";

interface WelcomeOverlayProps {
  onClose: () => void;
  open: boolean;
}

const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ onClose, open }) => {
  useEffect(() => {
    window.addEventListener("keydown", (e) => e.code === "Escape" && onClose());
    return () => window.removeEventListener("keydown", onClose);
  }, [onClose]);

  const isMobile = useIsMobile();

  return (
    <Backdrop
      component={Grid}
      sx={{
        backgroundColor: "rgba(0, 0, 0, 0)",
      }}
      zIndex={10000}
      justifyContent="center"
      alignItems="center"
      open={open}
      onClick={onClose}
      aria-hidden="false"
    >
      <Grid
        alignItems="center"
        container
        onClick={(e) => e.stopPropagation()}
        item
        sx={{ border: (theme) => `thin solid ${theme.palette.grey[300]}` }}
        component={Paper}
        maxWidth="900px"
        direction="column"
        padding={2}
        flexWrap="nowrap"
        overflow="auto"
      >
        <Grid item alignSelf="flex-end">
          <IconButton onClick={onClose}>
            <Typography color="primary" variant="h4">
              x
            </Typography>
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
          padding={4}
        >
          <Grid item>
            <Typography variant="h2">Welcome to Right of Way TO</Typography>
          </Grid>
          {isMobile ? (
            <Grid item>
              <Alert color="error">
                <AlertTitle>
                  Please Note that Right of Way TO is best viewed in a desktop
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
              Right of Way TO is an interactive map of Toronto&apos;s cycling
              routes. It also allows you to view optimal plans for new cycling
              infrastructure as calcuted by specialists at the University of
              Toronto (<Link href="/about">read more here</Link>
              ). You can also edit the map to add routes and track
              accessibility.
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="h6">
              Click <Link href="#">here</Link> to view the full tutorial.
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="h6">
              Or <ButtonLink onClick={onClose}>close</ButtonLink> this message
              to get started.
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Backdrop>
  );
};

export default WelcomeOverlay;
