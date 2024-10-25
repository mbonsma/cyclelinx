import axios from "axios";
import { ImprovementFeatureGeoJSON, ScoreResults } from "../ts/types";

export const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_ENDPOINT_BROWSER,
  timeout: 1000000,
});

export const fetchImprovements = (budgetId: number) =>
  axios.get<ImprovementFeatureGeoJSON>(
    `http://localhost:9033/budgets/${budgetId}/arterials`
  );

export const fetchBudgetScores = (budgetId: number) =>
  axios.get<ScoreResults>(`http://localhost:9033/budgets/${budgetId}/scores`);

export const fetchNewCalculations = (projectIds: number[]) =>
  axios.get<ScoreResults>(
    `http://localhost:9033/accessibility?project_ids=${projectIds.join(",")}`
  );
