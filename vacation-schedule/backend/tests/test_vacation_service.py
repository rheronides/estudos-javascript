"""Tests for VacationService — business logic and CLT rules."""
import pytest
from datetime import date
from sqlalchemy.orm import Session
from models import Employee
from schemas import CreateRequestData, VacationPeriodIn
from services.vacation_service import (
    ExceedsAnnualLimitError,
    MaxPeriodsReachedError,
    RequestNotFoundError,
    RequestNotPendingError,
    VacationService,
)


def make_data(employee_id: int, days: int, year: int = 2024) -> CreateRequestData:
    return CreateRequestData(
        employee_id=employee_id,
        advance_13th_salary=False,
        year=year,
        periods=[VacationPeriodIn(start_date=date(year, 7, 1), days_count=days)],
    )


class TestCreateRequest:
    def test_creates_pending_request(self, db: Session, employee: Employee):
        svc = VacationService(db)
        result = svc.create_request(make_data(employee.id, 14))
        assert result.status == "pending"
        assert result.total_days == 14

    def test_raises_when_exceeds_annual_limit(self, db: Session, employee: Employee):
        svc = VacationService(db)
        svc.create_request(make_data(employee.id, 25))
        with pytest.raises(ExceedsAnnualLimitError):
            svc.create_request(make_data(employee.id, 14))

    def test_raises_when_max_periods_reached(self, db: Session, employee: Employee):
        svc = VacationService(db)
        svc.create_request(CreateRequestData(
            employee_id=employee.id, advance_13th_salary=False, year=2024,
            periods=[VacationPeriodIn(start_date=date(2024, 1, 1), days_count=14)]
        ))
        svc.create_request(CreateRequestData(
            employee_id=employee.id, advance_13th_salary=False, year=2024,
            periods=[VacationPeriodIn(start_date=date(2024, 3, 1), days_count=8)]
        ))
        svc.create_request(CreateRequestData(
            employee_id=employee.id, advance_13th_salary=False, year=2024,
            periods=[VacationPeriodIn(start_date=date(2024, 5, 1), days_count=8)]
        ))
        with pytest.raises(MaxPeriodsReachedError):
            svc.create_request(CreateRequestData(
                employee_id=employee.id, advance_13th_salary=False, year=2024,
                periods=[VacationPeriodIn(start_date=date(2024, 8, 1), days_count=0)]
            ))

    def test_requests_are_independent_per_year(self, db: Session, employee: Employee):
        svc = VacationService(db)
        svc.create_request(make_data(employee.id, 30, year=2023))
        result = svc.create_request(make_data(employee.id, 14, year=2024))
        assert result.status == "pending"

    def test_stores_advance_13th_flag(self, db: Session, employee: Employee):
        data = CreateRequestData(
            employee_id=employee.id, advance_13th_salary=True, year=2024,
            periods=[VacationPeriodIn(start_date=date(2024, 7, 1), days_count=14)],
        )
        result = VacationService(db).create_request(data)
        assert result.advance_13th_salary is True


class TestApproveAndReject:
    def test_approve_sets_status(self, db: Session, employee: Employee, manager: Employee, pending_request):
        result = VacationService(db).approve(pending_request.id, manager.id)
        assert result.status == "approved"
        assert result.decided_by_id == manager.id
        assert result.decided_at is not None

    def test_reject_sets_status(self, db: Session, employee: Employee, manager: Employee, pending_request):
        result = VacationService(db).reject(pending_request.id, manager.id)
        assert result.status == "rejected"

    def test_raises_when_approving_non_pending(self, db: Session, manager: Employee, pending_request):
        svc = VacationService(db)
        svc.approve(pending_request.id, manager.id)
        with pytest.raises(RequestNotPendingError):
            svc.approve(pending_request.id, manager.id)

    def test_raises_when_request_not_found(self, db: Session, manager: Employee):
        with pytest.raises(RequestNotFoundError):
            VacationService(db).approve(9999, manager.id)


class TestGetPendingForManager:
    def test_returns_only_pending_from_team(self, db: Session, manager: Employee, employee: Employee, pending_request):
        result = VacationService(db).get_pending_for_manager(manager.id)
        assert len(result) == 1
        assert result[0].id == pending_request.id

    def test_excludes_decided_requests(self, db: Session, manager: Employee, employee: Employee, pending_request):
        pending_request.status = "approved"
        db.commit()
        result = VacationService(db).get_pending_for_manager(manager.id)
        assert result == []

    def test_returns_empty_for_manager_with_no_team(self, db: Session):
        lone_manager = Employee(name="Lone", role="CEO", department="Board",
                                is_manager=True, avatar_initials="LM")
        db.add(lone_manager)
        db.flush()
        result = VacationService(db).get_pending_for_manager(lone_manager.id)
        assert result == []


class TestGetDecisionsForManager:
    def test_returns_approved_and_rejected(self, db: Session, manager: Employee, pending_request):
        VacationService(db).approve(pending_request.id, manager.id)
        decisions = VacationService(db).get_decisions_for_manager(manager.id)
        assert len(decisions) == 1
        assert decisions[0].status == "approved"

    def test_excludes_pending(self, db: Session, manager: Employee, pending_request):
        decisions = VacationService(db).get_decisions_for_manager(manager.id)
        assert decisions == []
