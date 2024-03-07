from factories import budget_model_factory, dissemination_area_factory
from api.models import Metric, BudgetScore


def test_score_relationships(fresh_db):
    budget = budget_model_factory(fresh_db.session).create()
    da = dissemination_area_factory(fresh_db.session).create()
    metric = Metric(name="employment")
    score = BudgetScore(metric=metric, dissemination_area=da, budget=budget, score=1.2)
    assert score.metric.id == metric.id
