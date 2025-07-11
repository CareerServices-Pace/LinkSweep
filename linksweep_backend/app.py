from fastapi import FastAPI
from auth.routes import auth_router
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from fastapi.openapi.models import OAuth2 as OAuth2Model
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from dashboard.routes import dashboard_router
from history.routes import history_router
from config import routes as config_routes
from dotenv import load_dotenv
load_dotenv()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

app = FastAPI()
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(history_router)
app.include_router(config_routes.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://link-sweep.vercel.app", "http://localhost:3000/"],  # frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="LinkSweep API",
        version="1.0.0",
        description="LinkSweep - Internal Link Checker Tool",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method.setdefault("security", [{"BearerAuth": []}])
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi    
