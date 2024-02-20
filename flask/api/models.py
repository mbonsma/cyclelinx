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
    Table,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, Mapped

db = SQLAlchemy()

budgets_improvement_features = Table(
    "budgets_improvement_features",
    db.Model.metadata,
    Column("budget_id", ForeignKey("budgets.id"), primary_key=True),
    Column(
        "improvement_feature_id",
        ForeignKey("features.id"),
        primary_key=True,
    ),
)

arterials_projects = Table(
    "arterials_projects",
    db.Model.metadata,
    Column("arterial_id", ForeignKey("features.id"), primary_key=True),
    Column(
        "project_id",
        ForeignKey("projects.id"),
        primary_key=True,
    ),
)


class Budget(db.Model):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    improvement_features: Mapped[List["ImprovementFeature"]] = db.relationship(
        secondary=budgets_improvement_features,
        back_populates="budgets",
    )


class Feature(db.Model):
    __tablename__ = "features"
    id = Column(Integer, primary_key=True, index=True)
    ADDRESS_L = Column(String, nullable=True)
    ADDRESS_R = Column(String, nullable=True)
    CP_TYPE = Column(String, nullable=True)
    DIR_CODE_D = Column(String, nullable=True)
    FCODE = Column(Integer, nullable=True)
    FCODE_DESC = Column(String, nullable=True)
    feature_type = Column(String(255), nullable=False)
    FNODE = Column(Integer, nullable=True)
    GEO_ID = Column(Integer, nullable=True, unique=True)
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
    __mapper_args__ = {"polymorphic_on": "feature_type"}


class ImprovementFeature(Feature):
    budgets: Mapped[List[Budget]] = db.relationship(
        secondary=budgets_improvement_features,
        back_populates="improvement_features",
    )
    __mapper_args__ = {"polymorphic_identity": "improvement_feature"}


class Arterial(Feature):
    __mapper_args__ = {"polymorphic_identity": "arterial"}

    projects: Mapped[List["Project"]] = db.relationship(
        secondary=arterials_projects,
        back_populates="arterials",
    )


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
    geometry = Column(Geometry("MULTIPOLYGON"), nullable=False)
    scores = db.relationship("ProjectScore", back_populates="dissemination_area")


class Metric(db.Model):
    __tablename__ = "metrics"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)


class Project(db.Model):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    orig_id = Column(Integer, unique=True)
    scores = db.relationship("ProjectScore", back_populates="project")
    arterials: Mapped[List["Arterial"]] = db.relationship(
        secondary=arterials_projects,
        back_populates="projects",
    )


class ProjectScore(db.Model):
    __tablename__ = "project_scores"
    id = Column(Integer, primary_key=True)
    metric_id = Column(Integer, ForeignKey("metrics.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    dissemination_area_id = Column(
        Integer, ForeignKey("dissemination_areas.id"), nullable=False
    )
    score = Column(Float, nullable=False)

    __table_args__ = (UniqueConstraint(dissemination_area_id, metric_id, project_id),)

    project = db.relationship("Project", back_populates="scores")
    metric = db.relationship("Metric")
    dissemination_area = db.relationship("DisseminationArea", back_populates="scores")
