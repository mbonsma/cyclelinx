from api.models import Metric, FeatureScore

from tests.factories import (
    budget_model_factory,
    dissemination_area_factory,
    improvement_feature_model_factory,
)


def test_get_empty_budget(client):
    response = client.get("/budgets")
    assert response.status_code == 200
    assert response.json == []


def test_get_budgets(client, fresh_db):
    budget_model_factory(fresh_db.session).create_batch(10)
    response = client.get("/budgets")
    assert response.status_code == 200
    assert len(response.json) == 10


def test_get_budget_improvements(client, fresh_db):
    budget = budget_model_factory(fresh_db.session).create()
    improvements = improvement_feature_model_factory(fresh_db.session).create_batch(10)
    budget.improvement_features = improvements
    fresh_db.session.commit()
    response = client.get(f"/budgets/{budget.id}/features")
    assert response.status_code == 200
    assert len(response.json["features"]) == 10


def test_get_improvement_features(client, fresh_db):
    improvement = improvement_feature_model_factory(fresh_db.session).create()
    das = dissemination_area_factory(fresh_db.session).create_batch(5)
    metric = Metric(name="a")
    fresh_db.session.add(metric)
    fresh_db.session.commit()
    for da in das:
        score = FeatureScore(
            improvement_feature=improvement,
            dissemination_area=da,
            metric=metric,
            score=2,
        )
        fresh_db.session.add(score)
        fresh_db.session.commit()

    response = client.get(f"/improvement_features/{improvement.id}/scores")
    assert response.status_code == 200
