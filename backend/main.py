from fastapi import FastAPI, UploadFile, File, Form
from typing import Any, List, Optional
from pydantic import BaseModel
from .parsers import parse_resume, get_github_summary
from .analyzer import analyze_candidate
from .interview_engine import generate_interview_response
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
    github_username: str = Form(...),
    target_role: str = Form(default="Software Engineer")
) -> dict[str, Any]:

    resume_text: str = parse_resume(pdf_file=resume.file)
    github_data: dict[Any, Any] = get_github_summary(username=github_username)

    analysis: dict[str, Any] = analyze_candidate(
        resume_text=resume_text,
        github_data=github_data,
        target_role=target_role
    )

    return {
        "resume_text": resume_text,
        "github": github_data,
        "analysis": analysis
    }

class ChatMessage(BaseModel):
    role: str # "INTERVIEWER" or "CANDIDATE"
    content: str

class InterviewRequest(BaseModel):
    resume_text: str
    target_role: str
    chat_history: List[ChatMessage] = []
    latest_user_answer: Optional[str] = ""

@app.post("/interview")
async def interview_chat(request: InterviewRequest) -> dict[str, Any]:
    """
    Handles a single turn of the mock interview chat.
    If latest_user_answer is empty, it generates the very first question.
    """
    response = generate_interview_response(
        resume_text=request.resume_text,
        target_role=request.target_role,
        chat_history=[msg.dict() for msg in request.chat_history],
        latest_user_answer=request.latest_user_answer
    )
    return response