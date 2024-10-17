from dataclasses import dataclass
from typing import List

from flask_sqlalchemy import SQLAlchemy
from geoalchemy2 import Geometry
from sqlalchemy import (
    Column,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped

db = SQLAlchemy()


# each budget is a set of projects, but since an arterial can belong to
# several projects, we need to record which is associated with which budget
# so project_id is really just a piece of metadata here
# right now it's a simple lookup but if we need to get fancier we should use
# an association proxy: https://docs.sqlalchemy.org/en/20/orm/extensions/associationproxy.html#simplifying-association-objects
class BudgetProjectMember(db.Model):
    __tablename__ = "budget_project_members"
    arterial_id = Column(Integer, ForeignKey("arterials.id"), primary_key=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"), primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), primary_key=True)

    budget = db.relationship("Budget")
    project = db.relationship("Project")
    arterial = db.relationship("Arterial")


class Budget(db.Model):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    improvement_relationships: Mapped[List["BudgetProjectMember"]] = db.relationship(
        "BudgetProjectMember",
        back_populates="budget",
    )
    scores = db.relationship("BudgetScore", back_populates="budget")


class Arterial(db.Model):
    __tablename__ = "arterials"
    import_idx = Column(Integer, nullable=True)
    id = Column(Integer, primary_key=True, index=True)
    ADDRESS_L = Column(String, nullable=True)
    ADDRESS_R = Column(String, nullable=True)
    CP_TYPE = Column(String, nullable=True)
    DIR_CODE_D = Column(String, nullable=True)
    FCODE = Column(Integer, nullable=True)
    FCODE_DESC = Column(String, nullable=True)
    FNODE = Column(Integer, nullable=True)
    GEO_ID = Column(Integer, nullable=False)
    geometry = Column(Geometry("LINESTRING"), nullable=False)
    HINUML = Column(Integer, nullable=True)
    HINUMR = Column(Integer, nullable=True)
    JURIS_CODE = Column(String, nullable=True)
    length_in_ = Column(Float, nullable=True)
    LFN_ID = Column(Integer, nullable=True)
    LF_NAME = Column(String, nullable=True)
    LONUMR = Column(Integer, nullable=True)
    LONUML = Column(Integer, nullable=True)
    NBRLANES_2 = Column(Integer, nullable=True)
    OBJECTID = Column(Float, nullable=True)
    OE_FLAG_L = Column(String, nullable=True)
    OE_FLAG_R = Column(String, nullable=True)
    ONE_WAY_DI = Column(Integer, nullable=True)
    Shape_Leng = Column(Float, nullable=True)
    SPEED = Column(Integer, nullable=True)
    TNODE = Column(Integer, nullable=True)
    U500_20 = Column(String, nullable=True)
    total_length = Column(Float, nullable=False)
    # an arterial can be associated with more than one project only via budgets
    default_project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    default_project = db.relationship("Project", back_populates="default_arterials")
    improvement_relationships: Mapped[List["BudgetProjectMember"]] = db.relationship(
        "BudgetProjectMember",
        back_populates="arterial",
    )


class Project(db.Model):
    __tablename__ = "projects"
    # we take this id from the import indices
    id = Column(Integer, primary_key=True, index=True, autoincrement=False)
    default_arterials = db.relationship(
        "Arterial",
        back_populates="default_project",
    )
    improvement_relationships: Mapped[List["BudgetProjectMember"]] = db.relationship(
        "BudgetProjectMember",
        back_populates="project",
    )


class ExistingLane(db.Model):
    __tablename__ = "existing_lanes"
    id = Column(Integer, primary_key=True, index=True)
    _id = Column(Integer, nullable=True)
    OBJECTID = Column(Integer, nullable=True)
    SEGMENT_ID = Column(Integer, nullable=True)
    INSTALLED = Column(Integer, nullable=True)
    UPGRADED = Column(Integer, nullable=True)
    PRE_AMALGAMATION = Column(String, nullable=True)
    STREET_NAME = Column(String, nullable=True)
    FROM_STREET = Column(String, nullable=True)
    TO_STREET = Column(String, nullable=True)
    ROADCLASS = Column(String, nullable=True)
    CNPCLASS = Column(String, nullable=True)
    SURFACE = Column(String, nullable=True)
    OWNER = Column(String, nullable=True)
    DIR_LOWORDER = Column(String, nullable=True)
    INFRA_LOWORDER = Column(String, nullable=True)
    SEPA_LOWORDER = Column(String, nullable=True)
    SEPB_LOWORDER = Column(String, nullable=True)
    ORIG_LOWORDER_INFRA = Column(String, nullable=True)
    DIR_HIGHORDER = Column(String, nullable=True)
    INFRA_HIGHORDER = Column(String, nullable=True)
    SEPA_HIGHORDER = Column(String, nullable=True)
    SEPB_HIGHORDER = Column(String, nullable=True)
    ORIG_HIGHORDER = Column(String, nullable=True)
    BYLAWED = Column(String, nullable=True)
    EDITOR = Column(String, nullable=True)
    LAST_EDIT_DATE = Column(String, nullable=True)
    UPGRADE_DESCRIPTION = Column(String, nullable=True)
    CONVERTED = Column(String, nullable=True)
    geometry = Column(Geometry("MultiLineString"), nullable=False)
    total_length = Column(Float, nullable=False)


class DisseminationArea(db.Model):

    __tablename__ = "dissemination_areas"
    id = Column(Integer, primary_key=True, index=True)
    DAUID = Column(Integer, nullable=False, unique=True)
    PRUID = Column(Integer, nullable=True)
    PRNAME = Column(String, nullable=True)
    CDUID = Column(Integer, nullable=True)
    CDNAME = Column(String, nullable=True)
    CDTYPE = Column(String, nullable=True)
    CCSUID = Column(Integer, nullable=True)
    CCSNAME = Column(String, nullable=True)
    CSDUID = Column(Integer, nullable=True)
    CSDNAME = Column(String, nullable=True)
    CSDTYPE = Column(String, nullable=True)
    ERUID = Column(Integer, nullable=True)
    ERNAME = Column(String, nullable=True)
    SACCODE = Column(Integer, nullable=True)
    SACTYPE = Column(String, nullable=True)
    CMAUID = Column(Integer, nullable=True)
    CMAPUID = Column(Integer, nullable=True)
    CMANAME = Column(String, nullable=True)
    CMATYPE = Column(String, nullable=True)
    CTUID = Column(Float, nullable=True)
    CTNAME = Column(Float, nullable=True)
    ADAUID = Column(Integer, nullable=True)
    DAUID_int = Column(Integer, nullable=True)
    Shape_Leng = Column(Float, nullable=True)
    Shape_Area = Column(Float, nullable=True)
    origin_id = Column(
        Integer, nullable=True
    )  # this comes from study and we need it to look up scores
    geometry = Column(Geometry("MULTIPOLYGON"), nullable=False)
    scores = db.relationship("BudgetScore", back_populates="dissemination_area")


class Metric(db.Model):
    __tablename__ = "metrics"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)


class BudgetScore(db.Model):
    __tablename__ = "budget_scores"
    id = Column(Integer, primary_key=True)
    metric_id = Column(Integer, ForeignKey("metrics.id"), nullable=False)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=True)
    dissemination_area_id = Column(
        Integer, ForeignKey("dissemination_areas.id"), nullable=False
    )
    score = Column(Float, nullable=False)

    __table_args__ = (UniqueConstraint(dissemination_area_id, metric_id, budget_id),)

    budget = db.relationship("Budget", back_populates="scores")
    metric = db.relationship("Metric")
    dissemination_area = db.relationship("DisseminationArea", back_populates="scores")
