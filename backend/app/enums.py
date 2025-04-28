from enum import Enum

class DeletePartResult(str, Enum):
    SUCCESS = "success"
    NOT_FOUND = "not_found"
    HAS_CHILDREN = "has_children"
    EXISTS = "exists"
