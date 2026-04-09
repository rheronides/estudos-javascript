"""Integration tests for API routes — security headers, HTTP contracts, and error handling."""
import pytest
from fastapi.testclient import TestClient
from models import Employee


class TestRoot:
    def test_health(self, api_client: TestClient):
        r = api_client.get("/")
        assert r.status_code == 200

    def test_security_headers_present(self, api_client: TestClient):
        r = api_client.get("/")
        assert r.headers.get("x-content-type-options") == "nosniff"
        assert r.headers.get("x-frame-options") == "DENY"
        assert r.headers.get("referrer-policy") == "strict-origin-when-cross-origin"


class TestEmployeeRoutes:
    def test_list_employees(self, api_client: TestClient, employee: Employee):
        r = api_client.get("/employees/")
        assert r.status_code == 200
        assert any(e["name"] == "Ana Lima" for e in r.json())

    def test_get_employee_by_id(self, api_client: TestClient, employee: Employee):
        r = api_client.get(f"/employees/{employee.id}")
        assert r.status_code == 200
        assert r.json()["name"] == "Ana Lima"

    def test_get_employee_not_found(self, api_client: TestClient):
        r = api_client.get("/employees/9999")
        assert r.status_code == 404

    def test_get_balance(self, api_client: TestClient, employee: Employee):
        r = api_client.get(f"/employees/{employee.id}/balance", params={"year": 2024})
        assert r.status_code == 200
        data = r.json()
        assert data["total_days"] == 30
        assert data["remaining_days"] == 30

    def test_get_team(self, api_client: TestClient, manager: Employee, employee: Employee, employee2: Employee):
        r = api_client.get(f"/employees/{manager.id}/team")
        assert r.status_code == 200
        names = [e["name"] for e in r.json()]
        assert "Ana Lima" in names
        assert "Bruno Costa" in names


class TestVacationRoutes:
    def _valid_payload(self, employee_id: int) -> dict:
        return {
            "employee_id": employee_id,
            "advance_13th_salary": False,
            "year": 2024,
            "periods": [{"start_date": "2024-07-01", "days_count": 14}],
        }

    def test_create_request_success(self, api_client: TestClient, employee: Employee):
        r = api_client.post("/vacations/", json=self._valid_payload(employee.id))
        assert r.status_code == 200
        assert r.json()["status"] == "pending"
        assert r.json()["total_days"] == 14

    def test_create_request_clt_violation_returns_422(self, api_client: TestClient, employee: Employee):
        payload = self._valid_payload(employee.id)
        payload["periods"] = [{"start_date": "2024-07-01", "days_count": 5}]
        r = api_client.post("/vacations/", json=payload)
        assert r.status_code == 422

    def test_create_request_exceeds_annual_limit_returns_400(self, api_client: TestClient, employee: Employee):
        payload = self._valid_payload(employee.id)
        payload["periods"] = [{"start_date": "2024-07-01", "days_count": 30}]
        api_client.post("/vacations/", json=payload)
        r = api_client.post("/vacations/", json=self._valid_payload(employee.id))
        assert r.status_code == 400

    def test_get_pending_for_manager(self, api_client: TestClient, employee: Employee, manager: Employee, pending_request):
        r = api_client.get("/vacations/pending", params={"manager_id": manager.id})
        assert r.status_code == 200
        assert len(r.json()) == 1

    def test_get_decisions_empty_initially(self, api_client: TestClient, manager: Employee):
        r = api_client.get("/vacations/decisions", params={"manager_id": manager.id})
        assert r.status_code == 200
        assert r.json() == []

    def test_approve_request(self, api_client: TestClient, manager: Employee, pending_request):
        r = api_client.patch(
            f"/vacations/{pending_request.id}/approve",
            json={"manager_id": manager.id},
        )
        assert r.status_code == 200
        assert r.json()["status"] == "approved"

    def test_reject_request(self, api_client: TestClient, manager: Employee, pending_request):
        r = api_client.patch(
            f"/vacations/{pending_request.id}/reject",
            json={"manager_id": manager.id},
        )
        assert r.status_code == 200
        assert r.json()["status"] == "rejected"

    def test_double_approve_returns_400(self, api_client: TestClient, manager: Employee, pending_request):
        api_client.patch(f"/vacations/{pending_request.id}/approve", json={"manager_id": manager.id})
        r = api_client.patch(f"/vacations/{pending_request.id}/approve", json={"manager_id": manager.id})
        assert r.status_code == 400

    def test_approve_nonexistent_returns_404(self, api_client: TestClient, manager: Employee):
        r = api_client.patch("/vacations/9999/approve", json={"manager_id": manager.id})
        assert r.status_code == 404

    def test_get_employee_requests(self, api_client: TestClient, employee: Employee, pending_request):
        r = api_client.get(f"/vacations/employee/{employee.id}")
        assert r.status_code == 200
        assert len(r.json()) == 1

    def test_multiple_periods_in_single_request(self, api_client: TestClient, employee: Employee):
        payload = {
            "employee_id": employee.id,
            "advance_13th_salary": True,
            "year": 2024,
            "periods": [
                {"start_date": "2024-07-01", "days_count": 14},
                {"start_date": "2024-10-01", "days_count": 10},
            ],
        }
        r = api_client.post("/vacations/", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["total_days"] == 24
        assert data["advance_13th_salary"] is True
        assert len(data["periods"]) == 2
