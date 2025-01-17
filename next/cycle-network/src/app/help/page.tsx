"use client";

import React from "react";
import Image, { StaticImageData } from "next/image";
import { Box, Grid, Link, Typography } from "@mui/material";
import help1Image from "../../../public/help-section-1.png";
import help2Image from "../../../public/help-section-2.png";
import help3Image from "../../../public/help-section-3.png";
import help4Image from "../../../public/help-section-4.png";
import { InfoPageLayout } from "@/components";

const HelpPage = () => (
  <InfoPageLayout>
    <Typography align="center" marginBottom={3} variant="h2">
      Using Cyclelinx
    </Typography>
    <Grid container direction="column" spacing={3}>
      <HelpSectionOne />
      <HelpSectionTwo />
      <HelpSectionThree />
      <HelpSectionFour />
    </Grid>
  </InfoPageLayout>
);

const HelpSectionOne: React.FC = () => (
  <HelpSection title="Getting started">
    <HelpSectionText>
      <HelpSectionParagraph>
        The first thing you will see on the Cyclelinx app is a map of the
        Greater Toronto Area. Roads where new bike infrastructure can be added
        are marked in a light blue colour.
      </HelpSectionParagraph>
      <HelpSectionParagraph>
        The panel on the left allows you to view existing bike lanes as of 2021
        by type. It also allows you to select a <Strong>"budget"</Strong> (given
        in kilometers of new bike infrastructure). When a budget is selected,
        the map will be updated with new bike routes that are optimal for
        increasing accessibility to destinations given the existing
        infrastructure.
      </HelpSectionParagraph>
    </HelpSectionText>
    <HelpSectionImage
      alt="help-1"
      height={842}
      priority
      src={help1Image}
      width={1894}
    />
  </HelpSection>
);

const HelpSectionTwo: React.FC = () => (
  <HelpSection title="Viewing pre-computed routes">
    <HelpSectionText>
      <HelpSectionParagraph>
        After selecting a budget, the optimal new cycling routes will appear as
        blue lines on the map. The heat map (shown in green in the image) will
        indicate the accessibility created by the proposed infrastructure for
        each origin census{" "}
        <Link
          target="_blank"
          href="https://www12.statcan.gc.ca/census-recensement/2021/ref/dict/az/definition-eng.cfm?ID=geo021"
        >
          dissemination area
        </Link>{" "}
        . The type of infrastructure shown can be toggled in the section of the
        left-hand panel labeled <Strong>Metrics</Strong>.
      </HelpSectionParagraph>
      <HelpSectionParagraph>
        The left-hand panel also shows the average accessibility increase per{" "}
        <Link
          target="_blank"
          href="https://www12.statcan.gc.ca/census-recensement/2021/ref/dict/az/definition-eng.cfm?ID=geo021"
        >
          dissemination area
        </Link>{" "}
        over the "baseline" infrastructure, which by default is the current
        (2021) infrastructure.
      </HelpSectionParagraph>
      <HelpSectionParagraph>
        Click <Strong>Save</Strong> to store the current map and compare it with
        others.
      </HelpSectionParagraph>
    </HelpSectionText>
    <HelpSectionImage
      alt="help-2"
      height={760}
      priority
      src={help2Image}
      width={1737}
    />
  </HelpSection>
);

const HelpSectionThree: React.FC = () => (
  <HelpSection title="Comparing and downloading">
    <HelpSectionText>
      <HelpSectionParagraph>
        Once you've saved one or more maps, you can toggle between them by
        clicking on elements in the <Strong>History</Strong> section of the
        left-hand panel. You can download a GeoJSON representation of the map
        and a csv file of the accessibility scores by clicking the download
        icon. When you click <Strong>Set as Baseline</Strong>, the "Average
        Increase" number in the <Strong>Metrics</Strong> section will be
        calculated relative to the selected map for all other saved maps.
      </HelpSectionParagraph>
    </HelpSectionText>
    <HelpSectionImage alt="help3" height={816} src={help3Image} width={1739} />
  </HelpSection>
);

const HelpSectionFour: React.FC = () => (
  <HelpSection title="Adding and removing lanes">
    <HelpSectionText>
      <HelpSectionParagraph>
        Cyclelinx also allows you to <Strong>add new</Strong> lanes or{" "}
        <Strong>remove proposed</Strong> lanes from an existing budget or
        previous map. To add a new lane, click on any of the roads indicated
        with the pale blue color. These lanes will turn green to show that they
        have been marked for addition. If you click on an existing proposed
        (solid blue) lane, it will turn red, indicating that it is marked for
        removal. To calculate accessibility scores for the new map, click{" "}
        <Strong>Calculate New Scores</Strong> in the left-hand panel.
      </HelpSectionParagraph>
    </HelpSectionText>
    <HelpSectionImage alt="help4" height={810} src={help4Image} width={1730} />
  </HelpSection>
);

const HelpSection: React.FC<{ children: React.ReactNode; title: string }> = ({
  children,
  title,
}) => (
  <Grid container item spacing={3} direction="column">
    <Grid item>
      <Typography variant="h5">{title}</Typography>
    </Grid>
    <Grid container item direction="row" spacing={2}>
      {children}
    </Grid>
  </Grid>
);

const HelpSectionImage: React.FC<{
  alt: string;
  height: number;
  priority?: boolean;
  src: StaticImageData;
  width: number;
}> = ({ alt, height, src, priority, width }) => (
  <Grid item xs={12} md={8}>
    <Image
      alt={alt}
      height={height}
      priority={priority}
      src={src}
      style={{
        width: "100%",
        height: "auto",
      }}
      width={width}
    />
  </Grid>
);

const HelpSectionText: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Grid
    container
    direction="column"
    wrap="nowrap"
    item
    xs={12}
    md={4}
    spacing={2}
  >
    {children}
  </Grid>
);

const HelpSectionParagraph: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Grid item>
    <Typography>{children}</Typography>
  </Grid>
);

const Strong: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box component="span" fontWeight="bold">
    {children}
  </Box>
);

export default HelpPage;
