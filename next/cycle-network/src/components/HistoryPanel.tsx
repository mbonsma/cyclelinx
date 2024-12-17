import React from "react";
import { Delete, Download } from "@mui/icons-material";
import {
  Button,
  Divider,
  Grid,
  IconButton,
  lighten,
  Typography,
} from "@mui/material";
import { HistoryItem, ScoreResults } from "@/lib/ts/types";

interface HistoryPanelProps {
  active?: string;
  exportFn: (name: string) => void;
  history: HistoryItem[];
  removeFromHistory: (name: string) => void;
  resetBaseline: () => void;
  setBaseline: (scores: ScoreResults) => void;
  updateView: (history: HistoryItem) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  active,
  exportFn,
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
            alignItems="center"
            container
            direction="row"
            item
            justifyContent="space-between"
            onClick={() => updateView(h)}
            spacing={1}
            sx={{
              backgroundColor: (theme) =>
                active === h.name
                  ? lighten(theme.palette.secondary.light, 0.75)
                  : "inherit",
            }}
            width="100%"
            wrap="nowrap"
          >
            <HistoryPanelItem
              active={active === h.name}
              exportFn={exportFn.bind(null, h.name)}
              historyItem={h}
              removeFromHistory={removeFromHistory.bind(null, h.name)}
              setBaseline={setBaseline}
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
  exportFn: () => void;
  historyItem: HistoryItem;
  removeFromHistory: () => void;
  setBaseline: (scores: ScoreResults) => void;
}

const HistoryPanelItem: React.FC<HistoryPanelItem> = ({
  active,
  exportFn,
  historyItem,
  removeFromHistory,
  setBaseline,
}) => {
  return (
    <>
      <Grid item xs={4}>
        <Typography>{historyItem.name}</Typography>
      </Grid>
      <Grid item xs={4}>
        <Button
          disabled={!active}
          onClick={() => setBaseline(historyItem.scores)}
        >
          set as baseline
        </Button>
      </Grid>
      <Grid
        item
        container
        direction="column"
        xs={4}
        alignItems="flex-end"
        justifyContent="center"
      >
        <Grid item>
          <IconButton onClick={removeFromHistory} disabled={!active}>
            <Delete />
          </IconButton>
        </Grid>
        <Grid item>
          <IconButton onClick={exportFn} disabled={!active}>
            <Download />
          </IconButton>
        </Grid>
      </Grid>
    </>
  );
};

export default HistoryPanel;
