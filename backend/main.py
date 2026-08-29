from fastapi import FastAPI, UploadFile, File, Form
from typing import Any
from .parsers import parse_resume, get_github_summary
from .analyzer import analyze_candidate
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()
app.mount("/static", StaticFiles(directory="frontend"), name="static")
@app.get("/app")
def frontend():
    return FileResponse("frontend/index.html")


@app.get("/")
def home():
    return {"message": "AI Career Copilot API is running!"}


@app.post("/analyze")
async def analyze(
    resume: UploadFile = File(...),
    github_username: str = Form(...)
) -> dict[str, Any]:

    resume_text: str = parse_resume(pdf_file=resume.file)

    github_data: dict[Any, Any] = get_github_summary(
        username=github_username
    )

    analysis: dict[str, Any] = analyze_candidate(
        resume_text=resume_text,
        github_data=github_data
    )

    return {
        "resume_text": resume_text,
        "github": github_data,
        "analysis": analysis
    }