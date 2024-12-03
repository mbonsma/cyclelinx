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
import { Delete, Download } from "@mui/icons-material";

interface HistoryPanelProps {
  active?: string;
  history: HistoryItem[];
  removeFromHistory: (name: string) => void;
  resetBaseline: () => void;
  setBaseline: (scores: ScoreResults) => void;
  updateView: (history: HistoryItem) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  active,
  history,
  removeFromHistory,
  resetBaseline,
  setBaseline,
  updateView,
}) => {
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
              active={active === h.name}
              historyItem={h}
              removeFromHistory={removeFromHistory.bind(null, h.name)}
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
  active: boolean;
  historyItem: HistoryItem;
  removeFromHistory: () => void;
  setBaseline: (scores: ScoreResults) => void;
  updateView: (historyItem: HistoryItem) => void;
}

const HistoryPanelItem: React.FC<HistoryPanelItem> = ({
  active,
  historyItem,
  removeFromHistory,
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
      <Grid item container direction="column" xs={2}>
        <Grid item>
          <IconButton disabled={active}>
            <Delete onClick={removeFromHistory} />
          </IconButton>
        </Grid>
        <Grid item>
          <IconButton>
            <Download />
          </IconButton>
        </Grid>
      </Grid>
    </>
  );
};

export default HistoryPanel;
