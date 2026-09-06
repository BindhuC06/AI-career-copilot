from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import io, re
from pathlib import Path

try:
    from pypdf import PdfReader
except Exception:
    PdfReader = None

app = FastAPI(title='AI Career Copilot')
BASE_DIR = Path(__file__).resolve().parent

SKILL_ALIASES = {
    'Python':'python','Java':'java','JavaScript':'javascript','TypeScript':'typescript','C++':'c++','C':'c',
    'SQL':'sql','HTML':'html','CSS':'css','React':'react','Node.js':'node.js','FastAPI':'fastapi','Django':'django',
    'Flask':'flask','Git':'git','GitHub':'github','Docker':'docker','AWS':'aws','Azure':'azure','GCP':'gcp',
    'Machine Learning':'machine learning','Deep Learning':'deep learning','NLP':'nlp','Computer Vision':'computer vision',
    'TensorFlow':'tensorflow','PyTorch':'pytorch','Pandas':'pandas','NumPy':'numpy','Power BI':'power bi','Tableau':'tableau',
    'Figma':'figma','REST API':'rest api','MongoDB':'mongodb','PostgreSQL':'postgresql','MySQL':'mysql','Linux':'linux'
}

COURSES = {
    'python':'Build Python programming fundamentals and automation projects.',
    'sql':'Practice SQL, joins, aggregation and database design.',
    'git':'Use Git/GitHub workflows and publish 2–3 polished projects.',
    'machine learning':'Learn supervised learning, evaluation and model deployment.',
    'cloud':'Build and deploy one project on a cloud platform.',
    'communication':'Practice structured STAR answers and technical explanations.'
}

def extract_pdf(data: bytes) -> str:
    if not PdfReader:
        return ''
    try:
        reader = PdfReader(io.BytesIO(data))
        return '\n'.join((p.extract_text() or '') for p in reader.pages)
    except Exception:
        return ''

def github_data(username: str):
    # Optional live GitHub enrichment. If unavailable, the resume analysis still works.
    try:
        import urllib.request, json
        req = urllib.request.Request(f'https://api.github.com/users/{username}', headers={'User-Agent':'AI-Career-Copilot'})
        with urllib.request.urlopen(req, timeout=5) as r:
            profile = json.loads(r.read().decode())
        req2 = urllib.request.Request(f'https://api.github.com/users/{username}/repos?per_page=100&sort=updated', headers={'User-Agent':'AI-Career-Copilot'})
        with urllib.request.urlopen(req2, timeout=5) as r:
            repos = json.loads(r.read().decode())
        langs = {}
        for repo in repos:
            if repo.get('language'): langs[repo['language']] = langs.get(repo['language'], 0) + 1
        return profile, repos, langs
    except Exception:
        return {}, [], {}

def analyze_resume(text: str):
    low = text.lower()
    found = [name for name, key in SKILL_ALIASES.items() if key in low]
    strengths = []
    if len(found) >= 6: strengths.append('Broad technical foundation across multiple tools and technologies.')
    if any(x in low for x in ['project','projects','internship','experience']): strengths.append('Evidence of practical project or experience-based learning.')
    if any(x in low for x in ['github','git','repository','repo']): strengths.append('Shows software-development workflow and version-control exposure.')
    if any(x in low for x in ['lead','team','collaborat','volunteer']): strengths.append('Teamwork and collaboration signals are present.')
    if not strengths: strengths.append('Clear starting profile with room to build stronger evidence through projects.')

    gaps=[]
    if 'python' not in low: gaps.append('Python')
    if 'sql' not in low: gaps.append('SQL & databases')
    if not any(x in low for x in ['machine learning','tensorflow','pytorch']): gaps.append('Applied AI / machine learning')
    if not any(x in low for x in ['docker','aws','azure','gcp']): gaps.append('Deployment / cloud fundamentals')
    if not any(x in low for x in ['communication','leadership','team','collaborat']): gaps.append('Communication & teamwork evidence')
    gaps = gaps[:5]

    recs=[]
    if gaps:
        recs.append(f'Prioritize {gaps[0]} with one small, demonstrable project.')
        if len(gaps)>1: recs.append(f'Next, strengthen {gaps[1]} through a guided course and practice tasks.')
    recs.append('Pin your strongest GitHub projects and add concise READMEs with outcomes and screenshots.')
    recs.append('Practice 2–3 STAR-format interview answers using your real project experience.')
    score = min(96, max(38, 45 + len(found)*5 + (10 if 'project' in low else 0) - len(gaps)*2))
    return found, strengths, gaps, recs, score

@app.get('/health')
def health():
    return {'status':'ok','service':'AI Career Copilot'}

@app.post('/analyze')
async def analyze(resume: UploadFile = File(...), github_username: str = Form(...)):
    if resume.content_type not in ('application/pdf', 'application/octet-stream') and not resume.filename.lower().endswith('.pdf'):
        raise HTTPException(400, 'Please upload a PDF resume.')
    data = await resume.read()
    if len(data) > 20 * 1024 * 1024:
        raise HTTPException(413, 'Resume must be smaller than 20 MB.')
    username = github_username.strip().lstrip('@')
    if not re.fullmatch(r'[A-Za-z0-9-]{1,39}', username):
        raise HTTPException(400, 'Enter a valid GitHub username.')
    text = extract_pdf(data)
    skills, strengths, gaps, recs, score = analyze_resume(text)
    profile, repos, langs = github_data(username)
    github_skills = list(langs.keys())[:8]
    for s in github_skills:
        if s not in skills: skills.append(s)
    if profile:
        if profile.get('public_repos', 0) >= 3:
            strengths.append(f"Active public GitHub portfolio with {profile.get('public_repos')} repositories.")
        if not repos:
            gaps.append('Add more public project evidence')
    score = min(100, score + min(10, len(github_skills)*2))
    return {'analysis': {'skills': skills[:15], 'strengths': strengths[:5], 'skill_gaps': gaps[:6], 'recommendations': recs[:5], 'readiness_score': score, 'github': {'username': username, 'repos': len(repos), 'languages': github_skills}}}

# Serve the standalone frontend from the same app so /analyze works without CORS or localhost URLs.
app.mount('/static', StaticFiles(directory=str(BASE_DIR)), name='static')

@app.get('/')
def index():
    return FileResponse(BASE_DIR / 'index.html')
