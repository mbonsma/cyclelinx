#! /usr/bin/env python

# Script assumes that Arterials have already been imported

from csv import DictReader
import pickle
import re

from sqlalchemy import select, create_engine
from sqlalchemy.orm import Session

from api.models import Arterial, Budget, BudgetProjectMember
from api.settings import app_settings


def import_rows(mapping_path: str, csv_path: str, session: Session):

    with open(mapping_path, "rb") as f:
        project_mapping: list[list[int]] = pickle.load(f)

    art_by_proj = {}

    for proj_id, arterials in enumerate(project_mapping):
        art_by_proj[int(proj_id)] = arterials

    arterials = session.execute(select(Arterial)).scalars().all()

    art_by_idx = {}

    for arterial in arterials:
        art_by_idx[arterial.import_idx] = arterial

    with open(csv_path, "r") as f:
        reader = DictReader(f)
        for row in reader:
            budget_name: str = row["budget"]
            projects_str: str = row["projects"]

            budget = session.execute(
                select(Budget).filter(Budget.name == budget_name)
            ).scalar()

            if not budget:
                budget = Budget(name=budget_name)
                session.add(budget)
                session.commit()

            project_ids = [
                int(i) for i in re.sub(r"[\[\]]", "", projects_str).split(",")
            ]

            for proj_id in project_ids:
                for arterial_idx in art_by_proj[proj_id]:
                    member = BudgetProjectMember(
                        arterial_id=art_by_idx[arterial_idx].id,
                        budget_id=budget.id,
                        project_id=proj_id,
                    )
                    session.add(member)
                    session.commit()


def import_improvements(mapping_path: str, csv_path: str, session: Session):
    import_rows(mapping_path, csv_path, session)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        prog="Import Improvements",
        description="Add projects related to a budget from a csv mapping.",
    )

    parser.add_argument("--csv_path")
    parser.add_argument("--mapping_path")

    args = parser.parse_args()

    engine = create_engine(app_settings.POSTGRES_CONNECTION_STRING)

    with Session(engine) as session:
        import_improvements(args.mapping_path, args.csv_path, session)
