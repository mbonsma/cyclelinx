"use client";
import { Roboto } from "next/font/google";
import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    projectColor: string;
    projectRemoveColor: string;
  }
  interface PaletteOptions {
    projectColor: string;
    projectRemoveColor: string;
  }
}

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export default createTheme({
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
  palette: {
    mode: "light",
    primary: {
      main: "#8C6057",
    },
    secondary: {
      main: "#A69F98",
    },
    projectColor: "blue",
    projectRemoveColor: "red",
  },
});
