"use client";

import React from "react";
import Link from "next/link";
import {
  AppBar,
  Box,
  Container,
  Grid,
  styled,
  Toolbar,
  Typography,
} from "@mui/material";
import { HamburgerMenu } from "@/components";

interface InfoPageLayoutProps {
  children: React.ReactNode;
}

const UnstyledNavLink = styled(Link)(({ theme }) => ({
  textDecoration: "none",
  color: theme.palette.getContrastText(theme.palette.primary.main),
}));

const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ children }) => (
  <Container maxWidth="xl">
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary" sx={{ marginBottom: 3 }}>
        <Toolbar component={Grid} justifyContent="space-between">
          <Grid item>
            <UnstyledNavLink href="/">
              <Typography>Cycle App</Typography>
            </UnstyledNavLink>
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
