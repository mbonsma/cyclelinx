from api.models import Metric, BudgetScore

from tests.factories import (
    arterial_model_factory,
    budget_model_factory,
    dissemination_area_factory,
    project_model_factory,
)


def test_get_empty_budget(client, fresh_db):
    response = client.get("/budgets")
    assert response.status_code == 200
    print(len(response.json))
    assert response.json == []


def test_get_budgets(client, fresh_db):
    budget_model_factory(fresh_db.session).create_batch(10)
    response = client.get("/budgets")
    assert response.status_code == 200
    assert len(response.json) == 10


def test_get_das(client, fresh_db):
    dissemination_area_factory(fresh_db.session).create_batch(10)
    response = client.get("/das")
    assert response.status_code == 200
    assert len(response.json["features"]) == 10


def test_get_budget_arterials(client, fresh_db):
    budget = budget_model_factory(fresh_db.session).create()
    improvements = arterial_model_factory(fresh_db.session).create_batch(10)
    project = project_model_factory(fresh_db.session).create()
    budget.improvement_features = improvements

    project.arterials = improvements
    project.budgets = [budget]

    fresh_db.session.commit()
    response = client.get(f"/budgets/{budget.id}/arterials")
    assert response.status_code == 200
    assert len(response.json["features"]) == 10


def test_get_budget_scores(client, fresh_db):
    budget = budget_model_factory(fresh_db.session).create()
    das = dissemination_area_factory(fresh_db.session).create_batch(5)
    metric = Metric(name="a")
    fresh_db.session.add(metric)
    fresh_db.session.commit()
    for da in das:
        score = BudgetScore(
            budget=budget,
            dissemination_area=da,
            metric=metric,
            score=2,
        )
        fresh_db.session.add(score)
        fresh_db.session.commit()
        # defaults
        score = BudgetScore(
            budget=None,
            dissemination_area=da,
            metric=metric,
            score=1,
        )
        fresh_db.session.add(score)
        fresh_db.session.commit()

    response = client.get(f"/budgets/{budget.id}/scores")
    assert response.status_code == 200
    assert len(response.json) == 5  # dict w/ 5 keyes
