from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import API_PREFIX, APP_NAME
from app.routers import auth, users, machine_types, machines, checklists, states, reports

app = FastAPI(title=APP_NAME)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar los dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(machine_types.router, prefix=API_PREFIX)
app.include_router(machines.router, prefix=API_PREFIX)
app.include_router(checklists.router, prefix=API_PREFIX)
app.include_router(states.router, prefix=API_PREFIX)
app.include_router(reports.router, prefix=API_PREFIX)

@app.get("/")
async def root():
    return {
        "message": "MainsaCheck API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 