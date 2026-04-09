"""Seed the database with sample data matching the prototype."""
from datetime import date, datetime
from database import SessionLocal, engine
from models import Base, Employee, VacationPeriod, VacationRequest

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    if db.query(Employee).count() > 0:
        print("Database already seeded.")
        db.close()
        return

    # Managers
    marcos = Employee(name="Marcos Andrade", role="Gerente de Engenharia", department="Engenharia", is_manager=True, avatar_initials="MA")
    patricia = Employee(name="Patrícia Ferreira", role="Gerente de Design", department="Design", is_manager=True, avatar_initials="PF")
    db.add_all([marcos, patricia])
    db.flush()

    # Employees under Marcos
    ana = Employee(name="Ana Lima", role="Designer de Produto", department="Design", is_manager=False, manager_id=marcos.id, avatar_initials="AL")
    bruno = Employee(name="Bruno Costa", role="Desenvolvedor Sênior", department="Engenharia", is_manager=False, manager_id=marcos.id, avatar_initials="BC")
    carla = Employee(name="Carla Souza", role="Analista de QA", department="Engenharia", is_manager=False, manager_id=marcos.id, avatar_initials="CS")
    felipe = Employee(name="Felipe Oliveira", role="Desenvolvedor Pleno", department="Engenharia", is_manager=False, manager_id=marcos.id, avatar_initials="FO")
    daniela = Employee(name="Daniela Mendes", role="Desenvolvedora Júnior", department="Engenharia", is_manager=False, manager_id=marcos.id, avatar_initials="DM")
    ricardo = Employee(name="Ricardo Santos", role="DevOps Engineer", department="Engenharia", is_manager=False, manager_id=marcos.id, avatar_initials="RS")
    db.add_all([ana, bruno, carla, felipe, daniela, ricardo])
    db.flush()

    # Pending requests (3 pending for manager screen)
    req_ana = VacationRequest(employee_id=ana.id, status="pending", advance_13th_salary=False, year=2024, created_at=datetime(2024, 4, 10))
    req_bruno = VacationRequest(employee_id=bruno.id, status="pending", advance_13th_salary=True, year=2024, created_at=datetime(2024, 4, 8))
    req_carla = VacationRequest(employee_id=carla.id, status="pending", advance_13th_salary=False, year=2024, created_at=datetime(2024, 4, 6))
    db.add_all([req_ana, req_bruno, req_carla])
    db.flush()

    db.add_all([
        VacationPeriod(request_id=req_ana.id, start_date=date(2024, 7, 15), days_count=15),
        VacationPeriod(request_id=req_bruno.id, start_date=date(2024, 8, 1), days_count=30),
        VacationPeriod(request_id=req_carla.id, start_date=date(2024, 9, 15), days_count=15),
    ])

    # Decision history (approved/rejected)
    req_felipe = VacationRequest(
        employee_id=felipe.id, status="approved", advance_13th_salary=False, year=2024,
        created_at=datetime(2024, 4, 1), decided_at=datetime(2024, 4, 8), decided_by_id=marcos.id
    )
    req_daniela = VacationRequest(
        employee_id=daniela.id, status="rejected", advance_13th_salary=False, year=2024,
        created_at=datetime(2024, 4, 2), decided_at=datetime(2024, 4, 5), decided_by_id=marcos.id
    )
    req_ricardo = VacationRequest(
        employee_id=ricardo.id, status="approved", advance_13th_salary=False, year=2024,
        created_at=datetime(2024, 3, 25), decided_at=datetime(2024, 4, 2), decided_by_id=marcos.id
    )
    db.add_all([req_felipe, req_daniela, req_ricardo])
    db.flush()

    db.add_all([
        VacationPeriod(request_id=req_felipe.id, start_date=date(2024, 6, 10), days_count=15),
        VacationPeriod(request_id=req_daniela.id, start_date=date(2024, 5, 20), days_count=15),
        VacationPeriod(request_id=req_ricardo.id, start_date=date(2024, 12, 15), days_count=21),
    ])

    # Historical requests for Ana Lima (employee screen history)
    req_ana_2024_approved = VacationRequest(
        employee_id=ana.id, status="approved", advance_13th_salary=False, year=2024,
        created_at=datetime(2024, 1, 5), decided_at=datetime(2024, 1, 8), decided_by_id=marcos.id
    )
    req_ana_2023_pending = VacationRequest(
        employee_id=ana.id, status="pending", advance_13th_salary=False, year=2023,
        created_at=datetime(2023, 7, 20)
    )
    db.add_all([req_ana_2024_approved, req_ana_2023_pending])
    db.flush()

    db.add_all([
        VacationPeriod(request_id=req_ana_2024_approved.id, start_date=date(2024, 1, 15), days_count=15),
        VacationPeriod(request_id=req_ana_2023_pending.id, start_date=date(2023, 8, 5), days_count=10),
    ])

    db.commit()
    db.close()
    print("Database seeded successfully!")


if __name__ == "__main__":
    seed()
