"""Application configuration loaded from environment variables.

In production, set these via the environment or a .env file.
"""
import os

ALLOWED_ORIGINS: list[str] = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000",
).split(",")

DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./vacation.db")
