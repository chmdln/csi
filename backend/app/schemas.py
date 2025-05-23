from typing import Optional, List
from pydantic import BaseModel

class PartBase(BaseModel):
    name: str
    unit_price: int = 0
    quantity: int = 1
    parent_id: Optional[int] = None

class PartCreate(PartBase):
    pass 

class PartUpdate(BaseModel):
    name: Optional[str] = None
    unit_price: Optional[int] = None
    quantity: Optional[int] = None
    parent_id: Optional[int] = None


class PartOut(PartBase):
    id: int
    total_price: int
    children: List['PartOut'] = []

    class Config:
        from_attributes = True

PartOut.update_forward_refs()