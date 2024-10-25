from api.models import Metric, BudgetScore, BudgetProjectMember

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


def test_get_arterials(client, fresh_db):
    session = fresh_db.session
    budget = budget_model_factory(session).create()
    arterials = arterial_model_factory(session).create_batch(10)
    projects = project_model_factory(session).create_batch(2)

    for arterial in arterials:
        arterial.default_project_id = projects[0].id
        session.add(arterial)
        session.commit()

    for i in range(0, 2):
        bpm = BudgetProjectMember(
            arterial_id=arterials[i].id, budget_id=budget.id, project_id=projects[1].id
        )
        session.add(bpm)
        session.commit()

    # all the arterials will be in one project, and first 2 will be in a budget project too
    # will be members of another as well, through a budget
    response = client.get("/arterials")
    assert response.status_code == 200
    response_json = response.json
    assert len(response_json["features"]) == 10
    # assert that we have the right project_id
    assert (
        response_json["features"][0]["properties"]["default_project_id"]
        == projects[0].id
    )
    # assert that we have the correct budget_project_ids (where they exist)
    for feature in response_json["features"]:
        if feature["properties"]["budget_project_ids"]:
            assert len(feature["properties"]["budget_project_ids"]) == 1
            assert feature["properties"]["budget_project_ids"][0] == projects[1].id


def test_get_das(client, fresh_db):
    dissemination_area_factory(fresh_db.session).create_batch(10)
    response = client.get("/das")
    assert response.status_code == 200
    assert len(response.json["features"]) == 10


def test_get_budget_arterials(client, fresh_db):
    budget = budget_model_factory(fresh_db.session).create()
    arterials = arterial_model_factory(fresh_db.session).create_batch(10)
    project = project_model_factory(fresh_db.session).create()

    for arterial in arterials:
        m = BudgetProjectMember(
            project_id=project.id, arterial_id=arterial.id, budget_id=budget.id
        )
        fresh_db.session.add(m)
        fresh_db.session.commit()
    response = client.get(f"/budgets/{budget.id}/arterials")
    assert response.status_code == 200
    assert len(response.json) == 10


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
