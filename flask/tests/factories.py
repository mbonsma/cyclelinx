from factory.alchemy import SQLAlchemyModelFactory
from factory import Faker

import api.models as Models

# Faker providers: https://faker.readthedocs.io/en/latest/providers.html


def improvement_feature_model_factory(session):
    class ImprovementFeatureFactory(SQLAlchemyModelFactory):
        class Meta:
            model = Models.ImprovementFeature
            sqlalchemy_session = session
            sqlalchemy_session_persistence = "commit"

        GEO_ID = Faker("pyint")
        LFN_ID = Faker("pyint")
        LF_NAME = Faker("pyint")
        ADDRESS_L = Faker("pystr")
        ADDRESS_R = Faker("pystr")
        OE_FLAG_L = Faker("pystr")
        OE_FLAG_R = Faker("pystr")
        LONUML = Faker("pyint")
        HINUML = Faker("pyint")
        LONUMR = Faker("pyint")
        HINUMR = Faker("pyint")
        FNODE = Faker("pyint")
        TNODE = Faker("pyint")
        ONE_WAY_DI = Faker("pyint")
        DIR_CODE_D = Faker("pystr")
        FCODE = Faker("pyint")
        FCODE_DESC = Faker("pystr")
        JURIS_CODE = Faker("pystr")
        OBJECTID = Faker("pyfloat")
        CP_TYPE = Faker("pystr")
        SPEED = Faker("pyint")
        NBRLANES_2 = Faker("pyint")
        length_in_ = Faker("pyfloat")
        Shape_Leng = Faker("pyfloat")
        U500_20 = Faker("pystr")
        geometry = "LINESTRING (-79.40082705472463 43.64430503964604, -79.40083825308278 43.64430275536802, -79.4027055361314 43.64392631444804)"

    return ImprovementFeatureFactory


def budget_model_factory(session):
    class BudgetFactory(SQLAlchemyModelFactory):
        class Meta:
            model = Models.Budget
            sqlalchemy_session = session
            sqlalchemy_session_persistence = "commit"

        name = Faker("pystr")

    return BudgetFactory
