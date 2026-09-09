# AI Career Copilot

**AI-powered career growth, gap analysis, and interactive interview prep.**

![AI Career Copilot](https://img.shields.io/badge/Powered_by-Google_Gemini-blue?style=for-the-badge) ![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge) ![Docker](https://img.shields.io/badge/Containerized-Docker-2496ED?style=for-the-badge) ![AWS](https://img.shields.io/badge/Hosted-AWS_EC2-FF9900?style=for-the-badge)

## Live Demo
The application is fully containerized and hosted live on AWS EC2! 
**Try it here:** `http://54.157.236.126:8000/` 

## Inspiration
Job seekers, especially students, often struggle to identify exactly what skills they are missing for their dream roles. **AI Career Copilot** bridges this gap by cross-referencing a candidate's resume and live GitHub portfolio against their target job role. It doesn't just point out flaws, it provides a direct and actionable learning roadmap using the **IBM SkillsBuild** course catalog and prepares the candidate with adaptive, AI-driven mock interviews.

## Key Features
* **Resume & Portfolio Analysis:** Parses PDF resumes and fetches live GitHub repository data to understand the candidate's true technical foundation.
* **Gemini-Powered Gap Detection:** Uses `gemini-3.6-flash` to identify critical missing skills based on the user's highly specific target role.
* **IBM SkillsBuild Integration:** Dynamically matches the user's skill gaps to specific courses in the IBM SkillsBuild catalog, injecting direct links into their personalized learning roadmap.
* **Interactive AI Mock Interviews:** An embedded chat interface that generates adaptive technical interview questions based on the candidate's profile, evaluates their answers, and provides instant, scored feedback.
* **Sleek Dashboard UI:** A beautiful, responsive frontend to visualize career readiness scores, strengths, and recommendations.

## Architecture & Tools Used
* **AI Coding Agent-IBM Bob:** We heavily utilized **IBM Bob (IDE & Coding Agent)** throughout our development lifecycle. Bob accelerated our coding by generating the FastAPI boilerplate code, writing the complex LangChain logic for Gemini, and debugging a lot of our Docker container configurations.
* **Frontend:** Vanilla HTML, CSS, and JavaScript.
* **Backend:** Python & FastAPI.
* **AI Engine:** Google Gemini (`gemini-3.6-flash`) via LangChain.
* **Deployment:** Fully Dockerized and hosted on an AWS EC2 instance.

## How to Run Locally

### Option 1: The Easy Way (Docker)
1. Clone the repository.
2. Create a `.env` file in the root directory and add your Google API Key:
   ```env
   GOOGLE_API_KEY=your_api_key_here
   ```
3. Build and run the container:
   ```bash
   docker build -t ai-career-copilot .
   docker run -d -p 8000:8000 --env-file .env ai-career-copilot
   ```
4. Open `http://localhost:8000` in your browser.

### Option 2: The Developer Way (Python)
1. Clone the repository.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set your `GOOGLE_API_KEY` in a `.env` file.
4. Start the FastAPI server:
   ```bash
   uvicorn backend.main:app --reload
   ```
5. Open `http://127.0.0.1:8000` in your browser.

## Hackathon Submission
This project was built for the IBM Skillsbuild Hackathon. We focused on delivering a fully functional, end to end cloud-hosted solution that solves real-world career progression challenges using cutting-edge Generative AI.
