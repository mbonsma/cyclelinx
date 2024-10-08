from factory.alchemy import SQLAlchemyModelFactory
from factory import Faker, Sequence

import api.models as Models

# Faker providers: https://faker.readthedocs.io/en/latest/providers.html


def improvement_feature_model_factory(session):
    class ImprovementFeatureFactory(SQLAlchemyModelFactory):
        class Meta:
            model = Models.ImprovementFeature
            sqlalchemy_session = session
            sqlalchemy_session_persistence = "commit"

        feature_type = "improvement_feature"
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
        total_length = Faker("pyfloat")

    return ImprovementFeatureFactory


def arterial_model_factory(session):
    class ArterialFactory(improvement_feature_model_factory(session)):
        class Meta:
            model = Models.Arterial
            sqlalchemy_session = session
            sqlalchemy_session_persistence = "commit"

        feature_type = "arterial"

    return ArterialFactory


def project_model_factory(session):
    class ProjectFactory(SQLAlchemyModelFactory):
        class Meta:
            model = Models.Project
            sqlalchemy_session = session
            sqlalchemy_session_persistence = "commit"

        orig_id = Sequence(lambda n: n)

    return ProjectFactory


def dissemination_area_factory(session):
    class DisseminationAreaFactory(SQLAlchemyModelFactory):
        class Meta:
            model = Models.DisseminationArea
            sqlalchemy_session = session
            sqlalchemy_session_persistence = "commit"

        DAUID = Faker("pyint")
        PRUID = Faker("pyint")
        PRNAME = Faker("pystr")
        CDUID = Faker("pyint")
        CDNAME = Faker("pystr")
        CDTYPE = Faker("pystr")
        CCSUID = Faker("pyint")
        CCSNAME = Faker("pystr")
        CSDUID = Faker("pyint")
        CSDNAME = Faker("pystr")
        CSDTYPE = Faker("pystr")
        ERUID = Faker("pyint")
        ERNAME = Faker("pystr")
        SACCODE = Faker("pyint")
        SACTYPE = Faker("pystr")
        CMAUID = Faker("pyint")
        CMAPUID = Faker("pyint")
        CMANAME = Faker("pystr")
        CMATYPE = Faker("pystr")
        CTUID = Faker("pyfloat")
        CTNAME = Faker("pyfloat")
        ADAUID = Faker("pyint")
        DAUID_int = Faker("pyint")
        Shape_Leng = Faker("pyfloat")
        Shape_Area = Faker("pyfloat")
        geometry = "MULTIPOLYGON (((7212775.082900003 920625.879999999, 7212687.302900001 920581.1143000014, 7212632.305699997 920679.5628999993, 7212583.608599998 920771.8486000001, 7212563.648599997 920805.7113999985, 7212651.268600002 920853.6257000007, 7212737.685699999 920900.2342999987, 7212820.245700002 920945.1171000004, 7212904.640000001 920991.3685999997, 7212987.194300003 921036.2514000013, 7213079.2971 921085.9571000002, 7213185.082900003 920889.3513999991, 7213201.454300001 920855.8429000005, 7213109.3486 920806.1370999999, 7213028.808600001 920761.6114000008, 7212944.237099998 920716.365699999, 7212860.6657000035 920671.308600001, 7212775.082900003 920625.879999999)))"

    return DisseminationAreaFactory


def budget_model_factory(session):
    class BudgetFactory(SQLAlchemyModelFactory):
        class Meta:
            model = Models.Budget
            sqlalchemy_session = session
            sqlalchemy_session_persistence = "commit"

        name = Sequence(lambda n: n)

    return BudgetFactory
