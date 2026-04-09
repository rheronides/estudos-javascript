"""Thin controller: delegates all logic to VacationService."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import DecisionIn, VacationRequestIn, VacationRequestOut
from services.vacation_service import (
    DomainError,
    ExceedsAnnualLimitError,
    MaxPeriodsReachedError,
    RequestNotFoundError,
    RequestNotPendingError,
    VacationService,
)

router = APIRouter(prefix="/vacations", tags=["vacations"])


def _service(db: Session = Depends(get_db)) -> VacationService:
    return VacationService(db)


@router.post("/", response_model=VacationRequestOut)
def create_request(body: VacationRequestIn, service: VacationService = Depends(_service)):
    try:
        return service.create_request(body.to_create_data())
    except (ExceedsAnnualLimitError, MaxPeriodsReachedError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/employee/{employee_id}", response_model=list[VacationRequestOut])
def get_employee_requests(employee_id: int, year: int | None = None, service: VacationService = Depends(_service)):
    return service.get_employee_requests(employee_id, year)


@router.get("/pending", response_model=list[VacationRequestOut])
def get_pending(manager_id: int, service: VacationService = Depends(_service)):
    return service.get_pending_for_manager(manager_id)


@router.get("/decisions", response_model=list[VacationRequestOut])
def get_decisions(manager_id: int, service: VacationService = Depends(_service)):
    return service.get_decisions_for_manager(manager_id)


@router.patch("/{request_id}/approve", response_model=VacationRequestOut)
def approve(request_id: int, body: DecisionIn, service: VacationService = Depends(_service)):
    try:
        return service.approve(request_id, body.manager_id)
    except RequestNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RequestNotPendingError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{request_id}/reject", response_model=VacationRequestOut)
def reject(request_id: int, body: DecisionIn, service: VacationService = Depends(_service)):
    try:
        return service.reject(request_id, body.manager_id)
    except RequestNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RequestNotPendingError as e:
        raise HTTPException(status_code=400, detail=str(e))
