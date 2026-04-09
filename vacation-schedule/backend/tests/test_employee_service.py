"""Tests for EmployeeService — business logic layer."""
import pytest
from sqlalchemy.orm import Session
from models import Employee
from services.employee_service import EmployeeNotFoundError, EmployeeService


class TestGetAll:
    def test_returns_all_employees(self, db: Session, manager: Employee, employee: Employee):
        result = EmployeeService(db).get_all()
        assert len(result) == 2

    def test_returns_empty_when_no_employees(self, db: Session):
        assert EmployeeService(db).get_all() == []


class TestGetById:
    def test_returns_correct_employee(self, db: Session, employee: Employee):
        result = EmployeeService(db).get_by_id(employee.id)
        assert result.name == "Ana Lima"

    def test_raises_when_not_found(self, db: Session):
        with pytest.raises(EmployeeNotFoundError):
            EmployeeService(db).get_by_id(9999)


class TestGetBalance:
    def test_full_balance_when_no_requests(self, db: Session, employee: Employee):
        balance = EmployeeService(db).get_balance(employee.id, 2024)
        assert balance.total_days == 30
        assert balance.used_days == 0
        assert balance.remaining_days == 30
        assert balance.periods_used == 0

    def test_balance_reflects_pending_requests(self, db: Session, employee: Employee, pending_request):
        balance = EmployeeService(db).get_balance(employee.id, 2024)
        assert balance.used_days == 14
        assert balance.remaining_days == 16
        assert balance.periods_used == 1

    def test_balance_ignores_rejected_requests(self, db: Session, employee: Employee, pending_request):
        pending_request.status = "rejected"
        db.commit()
        balance = EmployeeService(db).get_balance(employee.id, 2024)
        assert balance.used_days == 0

    def test_balance_is_year_scoped(self, db: Session, employee: Employee, pending_request):
        balance = EmployeeService(db).get_balance(employee.id, 2025)
        assert balance.used_days == 0

    def test_raises_when_employee_not_found(self, db: Session):
        with pytest.raises(EmployeeNotFoundError):
            EmployeeService(db).get_balance(9999, 2024)


class TestGetTeam:
    def test_manager_sees_direct_reports(self, db: Session, manager: Employee, employee: Employee, employee2: Employee):
        team = EmployeeService(db).get_team(manager.id)
        ids = {e.id for e in team}
        assert employee.id in ids
        assert employee2.id in ids

    def test_employee_sees_peers(self, db: Session, manager: Employee, employee: Employee, employee2: Employee):
        team = EmployeeService(db).get_team(employee.id)
        ids = {e.id for e in team}
        assert employee2.id in ids
        assert employee.id not in ids

    def test_raises_when_not_found(self, db: Session):
        with pytest.raises(EmployeeNotFoundError):
            EmployeeService(db).get_team(9999)
