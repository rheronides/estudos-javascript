"""Application service: employee queries and balance calculation."""
from sqlalchemy.orm import Session
from models import Employee, VacationRequest
from schemas import VacationBalanceOut

ANNUAL_DAYS = 30
MAX_PERIODS = 3


class EmployeeNotFoundError(Exception):
    pass


class EmployeeService:
    def __init__(self, db: Session):
        self._db = db

    def get_all(self) -> list[Employee]:
        return self._db.query(Employee).all()

    def get_by_id(self, employee_id: int) -> Employee:
        employee = self._db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise EmployeeNotFoundError(f"Employee {employee_id} not found")
        return employee

    def get_balance(self, employee_id: int, year: int) -> VacationBalanceOut:
        self.get_by_id(employee_id)  # raises if not found
        active_requests = (
            self._db.query(VacationRequest)
            .filter(
                VacationRequest.employee_id == employee_id,
                VacationRequest.year == year,
                VacationRequest.status.in_(["approved", "pending"]),
            )
            .all()
        )
        used_days = sum(sum(p.days_count for p in r.periods) for r in active_requests)
        return VacationBalanceOut(
            year=year,
            total_days=ANNUAL_DAYS,
            used_days=used_days,
            remaining_days=ANNUAL_DAYS - used_days,
            periods_used=len(active_requests),
        )

    def get_team(self, employee_id: int) -> list[Employee]:
        employee = self.get_by_id(employee_id)
        if employee.is_manager:
            return self._db.query(Employee).filter(Employee.manager_id == employee_id).all()
        if employee.manager_id:
            return (
                self._db.query(Employee)
                .filter(Employee.manager_id == employee.manager_id, Employee.id != employee_id)
                .all()
            )
        return []
