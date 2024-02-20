#! /usr/bin/env python

import random

from geoalchemy2.comparator import Comparator
from geoalchemy2 import functions as func
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from shapely import wkb


from api.models import (
    Arterial,
    DisseminationArea,
    Project,
    ProjectScore,
    Metric,
)
from api.settings import app_settings


def get_nearby_das(arterial: Arterial, session: Session, limit=10):
    location = wkb.loads(str(arterial.geometry))

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
    projects = session.execute(select(Project)).scalars().all()

    metrics_models = []

    for metric in metrics:
        m = session.execute(select(Metric).filter(Metric.name == metric)).scalar()
        if not m:
            m = Metric(name=metric)
            session.add(m)
            session.commit()

        metrics_models.append(m)

    for project in projects:
        nearby_das = get_nearby_das(project.arterials[0], session)
        for da in nearby_das:
            for metric in metrics_models:
                score = random.randint(1, 10)
                score = ProjectScore(
                    project=project,
                    dissemination_area=da,
                    metric=metric,
                    score=score,
                )
                session.add(score)
                session.commit()


if __name__ == "__main__":
    engine = create_engine(app_settings.POSTGRES_CONNECTION_STRING)

    with Session(engine) as session:
        create_dummy_scores(session)
