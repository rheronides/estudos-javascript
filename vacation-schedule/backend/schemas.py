"""DTOs (Data Transfer Objects) for API input/output.

Validation of CLT business rules lives here so the API layer
enforces constraints before the service layer is invoked.
"""
from datetime import date, datetime
from dataclasses import dataclass, field
from pydantic import BaseModel, field_validator

MIN_FIRST_PERIOD_DAYS = 14
MIN_OTHER_PERIOD_DAYS = 5
MAX_PERIODS = 3
ANNUAL_DAYS = 30


# --- Nested DTOs ---

class VacationPeriodIn(BaseModel):
    start_date: date
    days_count: int


class VacationPeriodOut(BaseModel):
    id: int
    start_date: date
    days_count: int

    model_config = {"from_attributes": True}


# --- Employee ---

class EmployeeOut(BaseModel):
    id: int
    name: str
    role: str
    department: str
    is_manager: bool
    manager_id: int | None
    avatar_initials: str

    model_config = {"from_attributes": True}


# --- Vacation Request ---

class VacationRequestIn(BaseModel):
    employee_id: int
    advance_13th_salary: bool = False
    year: int
    periods: list[VacationPeriodIn]

    @field_validator("periods")
    @classmethod
    def validate_clt_rules(cls, periods: list[VacationPeriodIn]) -> list[VacationPeriodIn]:
        if not periods:
            raise ValueError("At least one period is required")
        if len(periods) > MAX_PERIODS:
            raise ValueError(f"Maximum of {MAX_PERIODS} periods allowed")
        total = sum(p.days_count for p in periods)
        if total > ANNUAL_DAYS:
            raise ValueError(f"Total days cannot exceed {ANNUAL_DAYS}")
        sorted_by_days = sorted(periods, key=lambda p: p.days_count, reverse=True)
        if sorted_by_days[0].days_count < MIN_FIRST_PERIOD_DAYS:
            raise ValueError(f"At least one period must have a minimum of {MIN_FIRST_PERIOD_DAYS} days (CLT rule)")
        for p in sorted_by_days[1:]:
            if p.days_count < MIN_OTHER_PERIOD_DAYS:
                raise ValueError(f"All periods must have at least {MIN_OTHER_PERIOD_DAYS} days (CLT rule)")
        return periods

    def to_create_data(self) -> "CreateRequestData":
        return CreateRequestData(
            employee_id=self.employee_id,
            advance_13th_salary=self.advance_13th_salary,
            year=self.year,
            periods=self.periods,
        )


class VacationRequestOut(BaseModel):
    id: int
    employee_id: int
    employee: EmployeeOut
    status: str
    advance_13th_salary: bool
    created_at: datetime
    decided_at: datetime | None
    decided_by_id: int | None
    year: int
    periods: list[VacationPeriodOut]
    total_days: int = 0

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_total(cls, obj) -> "VacationRequestOut":
        result = cls.model_validate(obj)
        result.total_days = sum(p.days_count for p in obj.periods)
        return result


class VacationBalanceOut(BaseModel):
    year: int
    total_days: int
    used_days: int
    remaining_days: int
    periods_used: int


class DecisionIn(BaseModel):
    manager_id: int


# --- Internal command object passed from API to Service ---

@dataclass
class CreateRequestData:
    employee_id: int
    year: int
    advance_13th_salary: bool
    periods: list[VacationPeriodIn]
    total_days: int = field(init=False)

    def __post_init__(self):
        self.total_days = sum(p.days_count for p in self.periods)
