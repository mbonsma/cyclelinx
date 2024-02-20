from factories import project_model_factory, dissemination_area_factory
from api.models import Metric, ProjectScore


def test_score_relationships(fresh_db):
    project = project_model_factory(fresh_db.session).create()
    da = dissemination_area_factory(fresh_db.session).create()
    metric = Metric(name="employment")
    score = ProjectScore(
        metric=metric, dissemination_area=da, project=project, score=1.2
    )
    assert score.metric.id == metric.id
