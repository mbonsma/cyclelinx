#! /usr/bin/env python

import random

from geoalchemy2.comparator import Comparator
from geoalchemy2 import functions as func
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, joinedload
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
    """Currently unused but keeping it around"""
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


def create_dummy_scores(
    session: Session, metrics=["recreation", "food", "greenspace", "employment"]
):

    budgets = (
        session.execute(
            select(Budget).options(
                joinedload(Budget.improvement_features).options(
                    joinedload(ImprovementFeature.dissemination_area)
                )
            )
        )
        .scalars()
        .unique()
        .all()
    )

    metrics_models = []

    for metric in metrics:
        m = session.execute(select(Metric).filter(Metric.name == metric)).scalar()
        if not m:
            m = Metric(name=metric)
            session.add(m)
            session.commit()

        metrics_models.append(m)

    das = session.execute(select(DisseminationArea)).scalars().all()

    # create baseline scores
    # todo: for greenspace, some should be zero
    to_insert = []
    for da in das:
        for metric in metrics_models:
            score = random.randint(1, 10)
            row = {
                "dissemination_area_id": da.id,
                "metric_id": metric.id,
                "score": score,
            }

            to_insert.append(row)

    stmt = insert(BudgetScore)
    # stmt = insert(BudgetScore).on_conflict_do_nothing()

    session.execute(stmt, to_insert)
    session.commit()

    # TODO: add greenspace metric, we want to know whether it existed before or is a new thing the lane gives access to
    # TODO: downtown scores are typically much, much higher

    for budget in budgets:

        das = {
            feature.dissemination_area
            for feature in budget.improvement_features
            if feature.dissemination_area is not None
        }

        to_insert = []

        for da in das:
            for metric in metrics_models:
                score = random.randint(11, 20) * (int(budget.name) * 0.1)
                row = {
                    "budget_id": budget.id,
                    "dissemination_area_id": da.id,
                    "metric_id": metric.id,
                    "score": score,
                }
                to_insert.append(row)

        stmt = insert(
            BudgetScore
        ).on_conflict_do_nothing()  # unless we keep a list of touched DAs, we'll have overlap

        session.execute(stmt, to_insert)
        session.commit()


if __name__ == "__main__":
    engine = create_engine(app_settings.POSTGRES_CONNECTION_STRING)

    with Session(engine) as session:
        print("creating dummy scores...")
        create_dummy_scores(session)
