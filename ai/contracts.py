from pydantic import BaseModel, Field
from typing import List, Dict, Any


class EventPlan(BaseModel):
    title: str
    date_range: str
    city: str
    personas: List[str]
    goals: List[str]
    budget_band: str
    risks: List[str]
    sponsor_targets: List[str]
    next_actions: List[str]


class AnalyticsReport(BaseModel):
    question: str
    data_sources: List[str]
    method: str
    findings: List[str]
    caveats: List[str] = Field(default_factory=list)
    decisions: List[str] = Field(default_factory=list)
    appendix: Dict[str, Any] = Field(default_factory=dict)


class ContractReview(BaseModel):
    doc_title: str
    clauses_risky: List[str] = Field(default_factory=list)
    redlines: List[str] = Field(default_factory=list)
    negotiation_positions: List[str] = Field(default_factory=list)
    summary: str

