"""Thin controller: delegates all logic to EmployeeService."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import EmployeeOut, VacationBalanceOut
from services.employee_service import EmployeeNotFoundError, EmployeeService

router = APIRouter(prefix="/employees", tags=["employees"])


def _service(db: Session = Depends(get_db)) -> EmployeeService:
    return EmployeeService(db)


@router.get("/", response_model=list[EmployeeOut])
def list_employees(service: EmployeeService = Depends(_service)):
    return service.get_all()


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, service: EmployeeService = Depends(_service)):
    try:
        return service.get_by_id(employee_id)
    except EmployeeNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{employee_id}/balance", response_model=VacationBalanceOut)
def get_balance(employee_id: int, year: int = 2024, service: EmployeeService = Depends(_service)):
    try:
        return service.get_balance(employee_id, year)
    except EmployeeNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{employee_id}/team", response_model=list[EmployeeOut])
def get_team(employee_id: int, service: EmployeeService = Depends(_service)):
    try:
        return service.get_team(employee_id)
    except EmployeeNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
