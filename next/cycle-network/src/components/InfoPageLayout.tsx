"use client";

import dynamic from "next/dynamic";

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
import { Footer } from "@/components";

const HamburgerMenu = dynamic(() => import("@/components/HamburgerMenu"), {
  ssr: false,
});
interface InfoPageLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const UnstyledNavLink = styled(Link)(({ theme }) => ({
  textDecoration: "none",
  color: theme.palette.getContrastText(theme.palette.primary.main),
}));

const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ children, title }) => (
  <Container maxWidth="lg">
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary" sx={{ marginBottom: 3 }}>
        <Toolbar component={Grid} justifyContent="space-between">
          <Grid item>
            <UnstyledNavLink href="/">
              <Typography>Cyclelinx</Typography>
            </UnstyledNavLink>
          </Grid>
          <Grid item>
            <Typography variant="h3">{title}</Typography>
          </Grid>
          <Grid item>
            <HamburgerMenu absolute={false} />
          </Grid>
        </Toolbar>
      </AppBar>
      {children}
    </Box>
    <Footer />
  </Container>
);

export default InfoPageLayout;
