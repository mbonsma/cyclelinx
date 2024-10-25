import axios from "axios";
import { BudgetProjectMember, ScoreResults } from "../ts/types";

export const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_ENDPOINT_BROWSER,
  timeout: 1000000,
});

export const fetchImprovements = (budgetId: number) =>
  client.get<BudgetProjectMember>(`budgets/${budgetId}/arterials`);

export const fetchBudgetScores = (budgetId: number) =>
  client.get<ScoreResults>(`budgets/${budgetId}/scores`);

export const fetchNewCalculations = (projectIds: number[]) =>
  client.get<ScoreResults>(`accessibility?project_ids=${projectIds.join(",")}`);
