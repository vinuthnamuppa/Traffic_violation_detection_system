"""
MongoDB connection helper.

In later phases we will define proper models and CRUD helpers here.
For now, this just exposes a `get_db` function wired to environment variables.
"""

import os

from dotenv import load_dotenv
from pymongo import MongoClient


load_dotenv()  # Load variables from the root `.env` file


_mongo_client = None


def get_mongo_client() -> MongoClient:
    """
    Return a singleton MongoClient instance.
    """
    global _mongo_client

    if _mongo_client is None:
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        _mongo_client = MongoClient(mongo_uri)

    return _mongo_client


def get_db():
    """
    Return the configured MongoDB database handle.
    """
    client = get_mongo_client()
    db_name = os.getenv("MONGODB_DB_NAME", "traffic_violation_db")
    return client[db_name]


