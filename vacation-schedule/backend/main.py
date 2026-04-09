from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from config import ALLOWED_ORIGINS
from database import engine
from models import Base
from routes import employees, vacations
from seed import seed

Base.metadata.create_all(bind=engine)
seed()

app = FastAPI(title="Vacation Intelligence API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next) -> Response:
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


app.include_router(employees.router)
app.include_router(vacations.router)


@app.get("/")
def root():
    return {"message": "Vacation Intelligence API is running"}
