"""Application service: vacation request lifecycle and approval workflow."""
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from models import Employee, VacationPeriod, VacationRequest
from schemas import CreateRequestData, VacationRequestOut

ANNUAL_DAYS = 30
MAX_PERIODS = 3
MIN_FIRST_PERIOD_DAYS = 14
MIN_OTHER_PERIOD_DAYS = 5


class DomainError(Exception):
    """Base class for business rule violations."""


class ExceedsAnnualLimitError(DomainError):
    pass


class MaxPeriodsReachedError(DomainError):
    pass


class RequestNotPendingError(DomainError):
    pass


class RequestNotFoundError(DomainError):
    pass


class VacationService:
    def __init__(self, db: Session):
        self._db = db

    def create_request(self, data: CreateRequestData) -> VacationRequestOut:
        self._validate_annual_limit(data.employee_id, data.year, data.total_days)
        request = VacationRequest(
            employee_id=data.employee_id,
            advance_13th_salary=data.advance_13th_salary,
            year=data.year,
            status="pending",
        )
        self._db.add(request)
        self._db.flush()
        for period in data.periods:
            self._db.add(VacationPeriod(request_id=request.id, start_date=period.start_date, days_count=period.days_count))
        self._db.commit()
        return VacationRequestOut.from_orm_with_total(self._load(request.id))

    def get_employee_requests(self, employee_id: int, year: int | None = None) -> list[VacationRequestOut]:
        query = (
            self._db.query(VacationRequest)
            .options(joinedload(VacationRequest.employee), joinedload(VacationRequest.periods))
            .filter(VacationRequest.employee_id == employee_id)
        )
        if year:
            query = query.filter(VacationRequest.year == year)
        return [VacationRequestOut.from_orm_with_total(r) for r in query.order_by(VacationRequest.created_at.desc()).all()]

    def get_pending_for_manager(self, manager_id: int) -> list[VacationRequestOut]:
        team_ids = self._team_ids(manager_id)
        if not team_ids:
            return []
        requests = (
            self._db.query(VacationRequest)
            .options(joinedload(VacationRequest.employee), joinedload(VacationRequest.periods))
            .filter(VacationRequest.employee_id.in_(team_ids), VacationRequest.status == "pending")
            .order_by(VacationRequest.created_at.asc())
            .all()
        )
        return [VacationRequestOut.from_orm_with_total(r) for r in requests]

    def get_decisions_for_manager(self, manager_id: int) -> list[VacationRequestOut]:
        team_ids = self._team_ids(manager_id)
        if not team_ids:
            return []
        requests = (
            self._db.query(VacationRequest)
            .options(joinedload(VacationRequest.employee), joinedload(VacationRequest.periods))
            .filter(VacationRequest.employee_id.in_(team_ids), VacationRequest.status.in_(["approved", "rejected"]))
            .order_by(VacationRequest.decided_at.desc())
            .all()
        )
        return [VacationRequestOut.from_orm_with_total(r) for r in requests]

    def approve(self, request_id: int, manager_id: int) -> VacationRequestOut:
        return self._decide(request_id, manager_id, "approved")

    def reject(self, request_id: int, manager_id: int) -> VacationRequestOut:
        return self._decide(request_id, manager_id, "rejected")

    # --- private helpers ---

    def _decide(self, request_id: int, manager_id: int, status: str) -> VacationRequestOut:
        request = self._load(request_id)
        if request.status != "pending":
            raise RequestNotPendingError("Request is not pending")
        request.status = status
        request.decided_at = datetime.now(timezone.utc)
        request.decided_by_id = manager_id
        self._db.commit()
        return VacationRequestOut.from_orm_with_total(self._load(request_id))

    def _validate_annual_limit(self, employee_id: int, year: int, new_days: int) -> None:
        active = (
            self._db.query(VacationRequest)
            .filter(
                VacationRequest.employee_id == employee_id,
                VacationRequest.year == year,
                VacationRequest.status.in_(["approved", "pending"]),
            )
            .all()
        )
        if len(active) >= MAX_PERIODS:
            raise MaxPeriodsReachedError(f"Maximum of {MAX_PERIODS} vacation requests per year reached")
        used = sum(sum(p.days_count for p in r.periods) for r in active)
        if used + new_days > ANNUAL_DAYS:
            raise ExceedsAnnualLimitError(f"Exceeds {ANNUAL_DAYS}-day annual limit. Used: {used}, Requested: {new_days}")

    def _load(self, request_id: int) -> VacationRequest:
        request = (
            self._db.query(VacationRequest)
            .options(joinedload(VacationRequest.employee), joinedload(VacationRequest.periods))
            .filter(VacationRequest.id == request_id)
            .first()
        )
        if not request:
            raise RequestNotFoundError(f"Vacation request {request_id} not found")
        return request

    def _team_ids(self, manager_id: int) -> list[int]:
        return [e.id for e in self._db.query(Employee).filter(Employee.manager_id == manager_id).all()]
