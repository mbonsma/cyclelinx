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

    # create baseline scores
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

    # TODO: add greenspace metric, we want to know whether it existed before or is a new thing the lane gives access to
    # TODO: downtown scores are typically much, much higher
    #

    for budget in budgets:
        """
        1. here we need a score for every DA, so it would be best if we could somehow group feature by DA
            - well, we could keep a list of inserted DAs, then check if the feature is in there
            - we could do this with geopandas....
            - is it possible to do it with shapely? ls = wkb.loads(str(feature.geometry)); ls.overlaps(/some da?/)
        2. we need a downtown check (need the coordinates for downtown toronto)
        3. would be good if we could legitimately check greenspace. Do we have parks? Would be good to have those shape files and load in.

        """

        seen_das = set()

        print(f"creating scores for budget {budget.id}...")
        # here we're using the actual streets, rather than arterials
        for segment in budget.improvement_features:
            # we're looking up way more DAs than we need, but at least we're not trying to insert them all....
            nearby_das = get_nearby_das(segment, session)
            for da in set([da.id for da in nearby_das]).difference(seen_das):
                for metric in metrics_models:
                    score = random.randint(11, 20) * (int(budget.name) * 0.1)
                    row = {
                        "budget_id": budget.id,
                        "dissemination_area_id": da,
                        "metric_id": metric.id,
                        "score": score,
                    }

                    stmt = insert(BudgetScore)

                    session.execute(stmt, row)
                    session.commit()
                    seen_das.add(da)


if __name__ == "__main__":
    engine = create_engine(app_settings.POSTGRES_CONNECTION_STRING)

    with Session(engine) as session:
        print("creating dummy scores...")
        create_dummy_scores(session)
