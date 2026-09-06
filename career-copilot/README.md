# AI Career Copilot — Render Ready

A complete full-stack AI Career Copilot application:
- Resume PDF upload and skill extraction
- GitHub username enrichment
- Career readiness score
- Strengths and skill gaps
- Personalized recommendations
- SkillsBuild learning links
- Mock interview practice

## Run locally

```bash
py -m pip install -r requirements.txt
py -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000

## Deploy publicly with Render

1. Create a new GitHub repository, e.g. `ai-career-copilot`.
2. Upload **all files in this folder** to the repository root.
3. In Render, choose **New → Web Service**.
4. Connect the GitHub repository.
5. Render can use the included `render.yaml`, or set:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/health`
6. Deploy.

The app serves both the frontend and FastAPI backend from the same public URL.
