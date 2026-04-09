from datetime import date, datetime
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(100))
    department: Mapped[str] = mapped_column(String(100))
    is_manager: Mapped[bool] = mapped_column(Boolean, default=False)
    manager_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("employees.id"), nullable=True)
    avatar_initials: Mapped[str] = mapped_column(String(3))

    manager: Mapped["Employee | None"] = relationship("Employee", remote_side=[id], back_populates="reports")
    reports: Mapped[list["Employee"]] = relationship("Employee", back_populates="manager")
    vacation_requests: Mapped[list["VacationRequest"]] = relationship("VacationRequest", back_populates="employee", foreign_keys="VacationRequest.employee_id")


class VacationRequest(Base):
    __tablename__ = "vacation_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"))
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, approved, rejected
    advance_13th_salary: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    decided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    decided_by_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("employees.id"), nullable=True)
    year: Mapped[int] = mapped_column(Integer)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="vacation_requests", foreign_keys=[employee_id])
    decided_by: Mapped["Employee | None"] = relationship("Employee", foreign_keys=[decided_by_id])
    periods: Mapped[list["VacationPeriod"]] = relationship("VacationPeriod", back_populates="request", cascade="all, delete-orphan")


class VacationPeriod(Base):
    __tablename__ = "vacation_periods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    request_id: Mapped[int] = mapped_column(Integer, ForeignKey("vacation_requests.id"))
    start_date: Mapped[date] = mapped_column(Date)
    days_count: Mapped[int] = mapped_column(Integer)

    request: Mapped["VacationRequest"] = relationship("VacationRequest", back_populates="periods")
