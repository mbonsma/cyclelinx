"use client";

import React from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { List, ListItemText, styled } from "@mui/material";
import { InfoPageLayout } from "@/components";

const AboutPage = () => (
  <InfoPageLayout title="About the Application">
    <Grid container direction="column" spacing={3} padding={5}>
      <Section title="Background">
        <Grid item>
          With limited budgets, where are the most effective places to build new
          cycling infrastructure? By rating cycling comfort on roads and paths
          on a scale from 1 to 4 using Level of Traffic Stress [1], we measure
          how many destinations can be reached within a 30-minute bike ride
          using only low-stress (Level of Traffic Stress 1 or 2) routes. For a
          given infrastructure budget in kms of new cycle tracks, our
          optimization model [2] finds a combination of high-stress arterial
          road segments that leads to the largest overall increase in
          accessibility to destinations.
        </Grid>
      </Section>
      <Section title="How this works">
        <Grid item>
          Choose an infrastructure budget from the menu to see the model&rsquo;s
          optimal plan for new cycling infrastructure. Each dissemination area
          (DA) is shaded by the increase in accessibility provided by the new
          infrastructure. Click on road segments to add or remove them from the
          infrastructure plan, then click “Calculate” to recalculate the change
          in accessibility. The calculation takes a few seconds to run.
        </Grid>
      </Section>
      <Section title="Terms">
        <Grid item>
          <>
            <Typography>
              <BulletLabel label="Level of Traffic Stress (LTS)" />a rating
              system developed in the US for cycling comfort and safety on roads
              and paths based on infrastructure conditions [3]. The ratings, a
              scale from 1 to 4, are based on surveys that group people into
              categories:
            </Typography>
            <Box>
              <List sx={{ marginLeft: 2 }} dense>
                <ListItemText>
                  1. “Strong and fearless”, about 4% of the population{" "}
                </ListItemText>
                <ListItemText>
                  2. “Enthused and confident”, about 9% of the population{" "}
                </ListItemText>
                <ListItemText>
                  3. “Interested but concerned”, about 56% of the population
                </ListItemText>
                <ListItemText>
                  4. “No way, no how”, about 31% of the population
                </ListItemText>
              </List>
            </Box>
            An LTS rating of 4 corresponds to high-stress riding in high-speed
            mixed vehicle traffic with no protec- tion from cars, tolerated only
            by the “strong and fearless”. LTS 3 may include a painted bike lane
            but is still near high-speed and/or high-volume traffic. LTS 2 is
            suitable for the 80% of potential cyclists who will not tolerate
            high-stress traffic environments, and LTS 1 is an additional
            category requiring physical separation from cars or slow traffic
            (under 40 km/h) and low traffic volumes. In Toronto, paths or cycle
            tracks that are physically separated from vehicles are LTS 1, while
            for painted bike lanes the LTS rating depends strongly on the number
            of vehicle lanes and vehicle speed and can be up to LTS 4 in some
            cases [4]. The majority of low-traffic and low-speed residential
            streets, even without dedicated cycling infrastructure, are LTS 1 or
            LTS 2. These streets are often in low-stress “islands” bounded by
            high-stress arterial roads [1]. 44% of roads and paths in Toronto
            are LTS 1, 34% LTS 2, 11% LTS 3, and 12% LTS 4 [4].
          </>
        </Grid>
        <Grid item>
          <BulletLabel label=" Accessibility to destinations" /> the number of
          destinations that can be reached within a distance or travel time
          cutoff from a point of origin. In this model, we optimize for
          accessibility to jobs within a 30-minute bike ride (7.5 km on the road
          network assuming 15 km/h average speed) using only low- stress roads
          and paths. Results can also be visualized as accessibility to
          populations and jobs.
        </Grid>
        <Grid item>
          <BulletLabel label="Jobs" /> the number of jobs in a census
          dissemination area from 2016 census data. Like others in this field,
          we use jobs as a proxy for general destinations of interest because
          the number of jobs in a location is correlated with general activity:
          for instance, there are lots of jobs at hospitals, schools, grocery
          stores, and entertainment venues.
        </Grid>
        <Grid item>
          <BulletLabel label="Dissemination area (DA)" />a Canadian census small
          unit of area that contains about 400-700 residents. It is larger than
          a dissemination block and smaller than a census tract [5].
        </Grid>
      </Section>
      <Section title="Read more">
        <BulletSubsection>
          Madeleine Bonsma-Fisher, Bo Lin, Timothy C. Y. Chan, and Shoshanna
          Saxe. Exploring the geographical equity-efficiency tradeoff in cycling
          infrastructure planning.{" "}
          <Italic>Journal of Transport Geography</Italic>, 121:104010, December
          2024
        </BulletSubsection>
        <BulletSubsection>
          Timothy C. Y. Chan, Bo Lin, and Shoshanna Saxe. A Machine Learning
          Approach to Solving Large Bilevel and Stochastic Programs: Application
          to Cycling Network Design, September 2022
        </BulletSubsection>
        <BulletSubsection>
          Bo Lin, Timothy C. Y. Chan, and Shoshanna Saxe. The Impact of COVID-19
          Cycling Infrastructure on Low-Stress Cycling Accessibility: A Case
          Study in the City of Toronto. <Italic>Findings</Italic>, February 2021
        </BulletSubsection>
        <BulletSubsection>
          Ahmadreza Faghih Imani, Eric J. Miller, and Shoshanna Saxe. Cycle
          accessibility and level of traffic stress: A case study of Toronto.
          <Italic>Journal of Transport Geography</Italic>, 80:102496, October
          2019
        </BulletSubsection>
      </Section>
      <Section title="References">
        <Citation number={1}>
          Ahmadreza Faghih Imani, Eric J. Miller, and Shoshanna Saxe. Cycle
          accessibility and level of traffic stress: A case study of Toronto.
          <Italic>Journal of Transport Geography</Italic>, 80:102496, October
          2019.
        </Citation>
        <Citation number={2}>
          Timothy C. Y. Chan, Bo Lin, and Shoshanna Saxe. A Machine Learning
          Approach to Solving Large Bilevel and Stochastic Programs: Application
          to Cycling Network Design, September 2022.
        </Citation>
        <Citation number={3}>
          Peter G. Furth, Maaza C. Mekuria, and Hilary Nixon. Network
          Connectivity for Low-Stress Bicycling.{" "}
          <Italic>Transportation Research Record</Italic>, 2587(1):41-49,
          January 2016.
        </Citation>
        <Citation number={4}>
          Amreen A. Imrit, Jaimy Fischer, Timothy C. Y. Chan, Shoshanna Saxe,
          and Madeleine Bonsma-Fisher. A Street-Specific Analysis of Level of
          Traffic Stress Trends in Strava Bicycle Ridership and its Implications
          for Low-Stress Bicycling Routes in Toronto. <Italic>Findings</Italic>,
          January 2024.
        </Citation>
        <Citation number={5}>
          Statistics Canada. Dictionary, Census of Population, 2021 -
          Dissemination area (DA).
          https://www12.statcan.gc.ca/census-recensement/2021/ref/dict/az/Definition-eng.cfm?ID=geo021,
          November 2021.
        </Citation>
        <Citation number={6}>
          Madeleine Bonsma-Fisher, Bo Lin, Timothy C. Y. Chan, and Shoshanna
          Saxe. Exploring the geographical equity-efficiency tradeoff in cycling
          infrastructure planning.{" "}
          <Italic>Journal of Transport Geography</Italic>, 121:104010, December
          2024.
        </Citation>
        <Citation number={7}>
          Bo Lin, Timothy C. Y. Chan, and Shoshanna Saxe. The Impact of COVID-19
          Cycling Infrastructure on Low-Stress Cycling Accessibility: A Case
          Study in the City of Toronto. <Italic>Findings</Italic>, February
          2021.
        </Citation>
      </Section>
    </Grid>
  </InfoPageLayout>
);

export default AboutPage;

interface SectionProps {
  children: React.ReactNode;
  title: string;
}

const Section: React.FC<SectionProps> = ({ children, title }) => (
  <Grid item container direction="column" spacing={3}>
    <Grid item>
      <Typography variant="h4">{title}</Typography>
    </Grid>
    {children}
  </Grid>
);

interface BulletSubsectionProps {
  children: React.ReactNode;
}

const BulletSubsection: React.FC<BulletSubsectionProps> = ({ children }) => (
  <Grid item>
    <Typography>
      <Bullet />
      {children}
    </Typography>
  </Grid>
);

interface BulletLabelProps {
  label: string;
}

const BulletLabel: React.FC<BulletLabelProps> = ({ label }) => (
  <Box fontWeight="bold" component="span">
    <Bullet />
    {label}:&nbsp;
  </Box>
);

const Bullet = () => (
  <Box
    marginRight={1}
    fontSize={20}
    component="span"
    paddingTop={3}
    position="relative"
    top={2}
  >
    &bull;
  </Box>
);

const Italic = styled("span")`
  font-style: italic;
`;

interface CitationProps {
  number: number;
  children: React.ReactNode;
}

const Citation: React.FC<CitationProps> = ({ children, number }) => (
  <Grid
    item
    container
    spacing={1}
    alignItems="flex-start"
    wrap="nowrap"
    direction="row"
  >
    <Grid item>{`[${number}]`}</Grid>
    <Grid item>{children}</Grid>
  </Grid>
);
