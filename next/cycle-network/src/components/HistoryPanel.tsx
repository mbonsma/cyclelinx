import React from "react";
import { Button, Divider, Grid, IconButton, Typography } from "@mui/material";
import { HistoryItem, ScoreResults } from "@/lib/ts/types";
import { Download } from "@mui/icons-material";

interface HistoryPanelProps {
  history: HistoryItem[];
  setBaseline: (scores: ScoreResults) => void;
  updateView: (history: HistoryItem) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  setBaseline,
  updateView,
}) => {
  return (
    <Grid marginTop={2} container item spacing={2} direction="column">
      {history.map((h, i) => (
        <React.Fragment key={h.name}>
          <Grid
            item
            alignItems="center"
            justifyContent="space-between"
            container
            direction="row"
            spacing={1}
            wrap="nowrap"
            width="100%"
          >
            <HistoryPanelItem
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
    </Grid>
  );
};

interface HistoryPanelItem {
  historyItem: HistoryItem;
  setBaseline: (scores: ScoreResults) => void;
  updateView: (historyItem: HistoryItem) => void;
}

const HistoryPanelItem: React.FC<HistoryPanelItem> = ({
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
          baseline
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
