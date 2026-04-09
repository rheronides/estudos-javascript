"""Shared fixtures: in-memory SQLite database and pre-seeded domain objects.

StaticPool is required for SQLite in-memory databases so all SQLAlchemy
operations share the same connection — otherwise a commit() can return the
connection to the pool and the next query opens a fresh, empty database.
"""
import sys
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from database import Base  # noqa: E402
from models import Employee, VacationRequest, VacationPeriod  # noqa: E402


def _make_engine():
    return create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )


@pytest.fixture(scope="function")
def db() -> Session:
    engine = _make_engine()
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def manager(db: Session) -> Employee:
    emp = Employee(name="Marcos Andrade", role="Gerente", department="Eng",
                   is_manager=True, avatar_initials="MA")
    db.add(emp)
    db.flush()
    return emp


@pytest.fixture
def employee(db: Session, manager: Employee) -> Employee:
    emp = Employee(name="Ana Lima", role="Designer", department="Design",
                   is_manager=False, manager_id=manager.id, avatar_initials="AL")
    db.add(emp)
    db.flush()
    return emp


@pytest.fixture
def employee2(db: Session, manager: Employee) -> Employee:
    emp = Employee(name="Bruno Costa", role="Dev", department="Eng",
                   is_manager=False, manager_id=manager.id, avatar_initials="BC")
    db.add(emp)
    db.flush()
    return emp


@pytest.fixture
def pending_request(db: Session, employee: Employee) -> VacationRequest:
    from datetime import date
    req = VacationRequest(employee_id=employee.id, status="pending",
                          advance_13th_salary=False, year=2024)
    db.add(req)
    db.flush()
    db.add(VacationPeriod(request_id=req.id, start_date=date(2024, 7, 1), days_count=14))
    db.commit()
    db.refresh(req)
    return req


@pytest.fixture
def api_client(db: Session):
    """TestClient backed by the test DB — startup seed is skipped."""
    from unittest.mock import patch
    from main import app
    from database import get_db

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    # Prevent main.py startup seed from running during tests
    with patch("main.seed"):
        client = TestClient(app, raise_server_exceptions=True)
        yield client
    app.dependency_overrides.clear()
