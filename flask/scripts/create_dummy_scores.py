#! /usr/bin/env python

import random

from geoalchemy2.comparator import Comparator
from geoalchemy2 import functions as func
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from shapely import wkb


from api.models import (
    Budget,
    BudgetScore,
    DisseminationArea,
    ImprovementFeature,
    Metric,
)
from api.settings import app_settings


def get_nearby_das(feature: ImprovementFeature, session: Session, limit=10):
    location = wkb.loads(str(feature.geometry))

    x, y = next(zip(location.xy[0], location.xy[1]))

    nearby_das = (
        session.execute(
            select(DisseminationArea)
            .order_by(
                Comparator.distance_centroid(
                    DisseminationArea.geometry,
                    func.ST_GeomFromText(f"POINT({x} {y})"),
                )
            )
            .limit(limit)
        )
        .scalars()
        .all()
    )

    return nearby_das


def create_dummy_scores(session: Session, metrics=["recreation", "food", "employment"]):

    # to make the dummy data, we're just going to take the first arterial of the project as the location
    budgets = session.execute(select(Budget)).scalars().all()

    metrics_models = []

    for metric in metrics:
        m = session.execute(select(Metric).filter(Metric.name == metric)).scalar()
        if not m:
            m = Metric(name=metric)
            session.add(m)
            session.commit()

        metrics_models.append(m)

    das = session.execute(select(DisseminationArea)).scalars().all()

    for da in das:
        for metric in metrics_models:
            score = random.randint(1, 10)
            row = {
                "dissemination_area_id": da.id,
                "metric_id": metric.id,
                "score": score,
            }

            stmt = insert(BudgetScore)

            session.execute(stmt, row)
            session.commit()

    for budget in budgets:
        print(f"creating scores for budget {budget.id}...")
        # here we're using the actual streets, rather than arterials....
        for segment in budget.improvement_features:
            # right now, this will just lead to redundancy, as we'll get the same nearby_da for a whole bunch
            # of features, when we need just one, so it might be wisest to first get the nearest
            # or we could just let it cycle through repeat budget/da combos and ignore (easiest for now)
            # TODO: change this, it's too slow....
            nearby_das = get_nearby_das(segment, session)
            for da in nearby_das:
                for metric in metrics_models:
                    score = random.randint(11, 20) * (int(budget.name) * 0.1)
                    row = {
                        "budget_id": budget.id,
                        "dissemination_area_id": da.id,
                        "metric_id": metric.id,
                        "score": score,
                    }

                    stmt = insert(BudgetScore).on_conflict_do_nothing()

                    session.execute(stmt, row)
                    session.commit()


if __name__ == "__main__":
    engine = create_engine(app_settings.POSTGRES_CONNECTION_STRING)

    with Session(engine) as session:
        print("creating dummy scores...")
        create_dummy_scores(session)
