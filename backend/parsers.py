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

    try:
        # verify=False prevents the SSL Certificate Verify Failed error when behind corporate proxies
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        response = requests.get(url, headers=headers, verify=False, timeout=10)

        if response.status_code != 200:
            return {
                "username": username,
                "repos": [],
                "error": f"Could not fetch GitHub repositories. Status: {response.status_code}"
            }

        repositories = response.json()
    except Exception as e:
        return {
            "username": username,
            "repos": [],
            "error": f"GitHub API Request Failed: {str(e)}"
        }

    return {
        "username": username,
        "repos": [
            {
                "name": repo.get("name", "Unknown"),
                "language": repo.get("language", "Unknown"),
                "stars": repo.get("stargazers_count", 0)
            }
            for repo in repositories
        ]
    }

