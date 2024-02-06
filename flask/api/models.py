from typing import List

from sqlalchemy import Column, Float, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship, Mapped
from geoalchemy2 import Geometry

from api.db import Base


budgets_improvement_features = Table(
    "budgets_improvement_features",
    Base.metadata,
    Column("budget_id", ForeignKey("budgets.id"), primary_key=True),
    Column(
        "improvement_feature_id",
        ForeignKey("improvement_features.id"),
        primary_key=True,
    ),
)


class Budget(Base):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    improvement_features: Mapped[List["ImprovementFeature"]] = relationship(
        secondary=budgets_improvement_features,
        back_populates="budgets",
    )


class ImprovementFeature(Base):
    __tablename__ = "improvement_features"
    id = Column(Integer, primary_key=True, index=True)
    GEO_ID = Column(Integer, nullable=True, unique=True)
    LFN_ID = Column(Integer, nullable=True)
    LF_NAME = Column(String, nullable=True)
    ADDRESS_L = Column(String, nullable=True)
    ADDRESS_R = Column(String, nullable=True)
    OE_FLAG_L = Column(String, nullable=True)
    OE_FLAG_R = Column(String, nullable=True)
    LONUML = Column(Integer, nullable=True)
    HINUML = Column(Integer, nullable=True)
    LONUMR = Column(Integer, nullable=True)
    HINUMR = Column(Integer, nullable=True)
    FNODE = Column(Integer, nullable=True)
    TNODE = Column(Integer, nullable=True)
    ONE_WAY_DI = Column(Integer, nullable=True)
    DIR_CODE_D = Column(String, nullable=True)
    FCODE = Column(Integer, nullable=True)
    FCODE_DESC = Column(String, nullable=True)
    JURIS_CODE = Column(String, nullable=True)
    OBJECTID = Column(Float, nullable=True)
    CP_TYPE = Column(String, nullable=True)
    SPEED = Column(Integer, nullable=True)
    NBRLANES_2 = Column(Integer, nullable=True)
    length_in_ = Column(Float, nullable=True)
    Shape_Leng = Column(Float, nullable=True)
    U500_20 = Column(String, nullable=True)
    geometry = Column(Geometry("LINESTRING"), nullable=True)
    budgets: Mapped[List[Budget]] = relationship(
        secondary=budgets_improvement_features,
        back_populates="improvement_features",
    )
