from tests.factories import budget_model_factory, improvement_feature_model_factory


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
