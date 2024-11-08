"use client";

import React from "react";
import {
  AppBar,
  Box,
  Container,
  Grid,
  Toolbar,
  Typography,
} from "@mui/material";
import HamburgerMenu from "./HamburgerMenu";

interface InfoPageLayoutProps {
  children: React.ReactNode;
}

const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ children }) => (
  <Container maxWidth="xl">
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary">
        <Toolbar component={Grid} justifyContent="space-between">
          <Grid item>
            <Typography>Cycle App</Typography>
          </Grid>
          <Grid item>
            <HamburgerMenu absolute={false} />
          </Grid>
        </Toolbar>
      </AppBar>
      {children}
    </Box>
  </Container>
);

export default InfoPageLayout;
