from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import Base
from routes import employees, vacations
from seed import seed

Base.metadata.create_all(bind=engine)
seed()

app = FastAPI(title="Vacation Intelligence API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees.router)
app.include_router(vacations.router)


@app.get("/")
def root():
    return {"message": "Vacation Intelligence API is running"}
