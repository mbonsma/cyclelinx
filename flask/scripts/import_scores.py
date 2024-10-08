#! /usr/bin/env python
from csv import DictReader
from typing import List, Dict, Any
import re

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

from api.settings import app_settings
from api.models import Budget, BudgetScore, Metric, DisseminationArea


def import_scores(csv_path: str, session: Session):

    # first, read csv, then delegate to lower-level, which just takes the array of data (this will be easier to test)
    rows = []
    with open(csv_path) as csvfile:
        reader = DictReader(csvfile)
        for row in reader:
            rows.append(row)

    _import_scores(rows, session)


def extract_scores(
    row: Dict[str, Any],
    metrics: Dict[str, int],
    budgets: Dict[str, int],
    das: Dict[int, int],
):
    ret = []
    da_id = das[int(row["origin_DA_id"])]
    for metric, metric_id in metrics.items():
        baseline_score = float(row[f"{metric}_original"] or 0)
        ret.append(
            {
                "metric_id": metric_id,
                "dissemination_area_id": da_id,
                "score": baseline_score,
            }
        )
        for budget, budget_id in budgets.items():
            score = baseline_score = float(row[f"{metric}_increase_{budget}"] or 0)
            ret.append(
                {
                    "metric_id": metric_id,
                    "dissemination_area_id": da_id,
                    "score": score,
                    "budget_id": budget_id,
                }
            )
    return ret


def _import_scores(rows: List[Dict[str, Any]], session: Session):

    csv_keys = list(rows[0].keys())

    csv_metrics = [key for key in csv_keys if key.endswith("_original")]
    csv_metrics = [re.findall(r"(\w+)_original$", m)[0] for m in csv_metrics]

    metrics = session.query(Metric).all()
    metric_names = [m.name for m in metrics]

    for metric in csv_metrics:
        if metric not in metric_names:
            m = Metric(name=metric)
            session.add(m)
            session.commit()

    metrics_map = {
        m.name: m.id
        for m in session.query(Metric).filter(Metric.name.in_(csv_metrics)).all()
    }

    budgets = session.query(Budget).all()
    budget_names = [m.name for m in session.query(Budget).all()]

    da_map = {d.DAUID: d.id for d in session.query(DisseminationArea).all()}

    csv_budgets = list(
        set(
            [
                n[0]
                for n in [re.findall(r"increase_(\d+)$", m) for m in csv_keys]
                if len(n)
            ]
        )
    )

    if set(csv_budgets).difference(set(budget_names)):
        raise ValueError("Found a budget in the csv that is not in the database!")

    budgets_map = {b.name: b.id for b in budgets}

    for row in rows:

        scores = extract_scores(row, metrics_map, budgets_map, da_map)
        stmt = insert(BudgetScore).on_conflict_do_nothing()
        session.execute(stmt, scores)
        session.commit()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        prog="Import Scores",
        description="Add scores from a 'wide' csv.",
    )

    parser.add_argument("--csv_path", required=True, type=str)

    args = parser.parse_args()

    engine = create_engine(app_settings.POSTGRES_CONNECTION_STRING)

    with Session(engine) as session:
        print("importing Scores...")
        import_scores(args.csv_path, session)
