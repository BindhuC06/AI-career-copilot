from pypdf import PdfReader
import requests
from dotenv import load_dotenv
import os

load_dotenv()



def parse_resume(pdf_file) -> str:
    reader = PdfReader(pdf_file)

    text = ""

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text
def get_github_summary(username: str) -> dict:
    url = f"https://api.github.com/users/{username}/repos"

    token = os.getenv("GITHUB_TOKEN")

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    }

    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        return {
            "username": username,
            "repos": [],
            "error": "Could not fetch GitHub repositories"
        }

    repositories = response.json()

    return {
        "username": username,
        "repos": [
            {
                "name": repo["name"],
                "language": repo["language"],
                "stars": repo["stargazers_count"]
            }
            for repo in repositories
        ]
    }

