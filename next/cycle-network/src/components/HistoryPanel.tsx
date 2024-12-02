import React from "react";
import {
  Button,
  Divider,
  Grid,
  IconButton,
  lighten,
  Typography,
  useTheme,
} from "@mui/material";
import { HistoryItem, ScoreResults } from "@/lib/ts/types";
import { Download } from "@mui/icons-material";
import ButtonLink from "./ButtonLink";

interface HistoryPanelProps {
  active?: string;
  history: HistoryItem[];
  resetBaseline: () => void;
  setBaseline: (scores: ScoreResults) => void;
  updateView: (history: HistoryItem) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  active,
  history,
  resetBaseline,
  setBaseline,
  updateView,
}) => {
  const theme = useTheme();

  return (
    <Grid marginTop={2} container item spacing={2} direction="column">
      {history.map((h, i) => (
        <React.Fragment key={h.name}>
          <Grid
            item
            sx={{
              backgroundColor: (theme) =>
                active === h.name
                  ? lighten(theme.palette.secondary.light, 0.75)
                  : "inherit",
            }}
            alignItems="center"
            justifyContent="space-between"
            container
            direction="row"
            spacing={1}
            wrap="nowrap"
            width="100%"
          >
            <HistoryPanelItem
              active={active}
              historyItem={h}
              setBaseline={setBaseline}
              updateView={updateView}
            />
          </Grid>
          {i < history.length - 1 && (
            <Grid item width="100%">
              <Divider />
            </Grid>
          )}
        </React.Fragment>
      ))}
      <Grid container item justifyContent="flex-start">
        <Button
          color="primary"
          variant="outlined"
          sx={{ marginTop: 4 }}
          onClick={resetBaseline}
        >
          reset baseline
        </Button>
      </Grid>
    </Grid>
  );
};

interface HistoryPanelItem {
  active?: string;
  historyItem: HistoryItem;
  setBaseline: (scores: ScoreResults) => void;
  updateView: (historyItem: HistoryItem) => void;
}

const HistoryPanelItem: React.FC<HistoryPanelItem> = ({
  active,
  historyItem,
  setBaseline,
  updateView,
}) => {
  return (
    <>
      <Grid item xs={3}>
        <Typography>{historyItem.name}</Typography>
      </Grid>
      <Grid item xs={3}>
        <Button onClick={() => setBaseline(historyItem.scores)}>
          set as baseline
        </Button>
      </Grid>
      <Grid item xs={3}>
        <Button onClick={() => updateView(historyItem)}>Show</Button>
      </Grid>
      <Grid item xs={2}>
        <IconButton>
          <Download />
        </IconButton>
      </Grid>
    </>
  );
};

export default HistoryPanel;
