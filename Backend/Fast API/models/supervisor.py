from pydantic import BaseModel
from typing import List, Optional

class Supervisor(BaseModel):
    name: str
    specialization: str
    email: str
    research_interests: Optional[List[str]] = []

