from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.database import Base, engine
from routers import parts 



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

app.include_router(parts.router)

Base.metadata.create_all(bind=engine)