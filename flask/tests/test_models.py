from factories import improvement_feature_model_factory, dissemination_area_factory
from api.models import FeatureScore, Metric


def test_score_relationships(fresh_db):
    feature = improvement_feature_model_factory(fresh_db.session).create()
    da = dissemination_area_factory(fresh_db.session).create()
    metric = Metric(name="employment")
    score = FeatureScore(
        metric=metric, dissemination_area=da, improvement_feature=feature, score=1.2
    )
    assert score.metric.id == metric.id
