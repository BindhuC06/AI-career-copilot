import re


def analyze_candidate(resume_text: str, github_data: dict) -> dict:
    """
    Analyze resume and GitHub data and return career insights.
    """

    resume_lower = resume_text.lower()

    # Skills we want to detect
    skill_keywords = [
        "python",
        "java",
        "sql",
        "javascript",
        "html",
        "css",
        "react",
        "fastapi",
        "machine learning",
        "deep learning",
        "artificial intelligence",
        "data structures",
        "algorithms",
        "git",
        "github",
        "docker",
        "flask",
        "tensorflow",
        "pytorch"
    ]

    # Find skills mentioned in resume
    skills = []

    for skill in skill_keywords:
        if skill in resume_lower:
            skills.append(skill)

    # Analyze GitHub repositories
    repos = github_data.get("repos", [])
    

    github_languages = []

    for repo in repos:
        language = repo.get("language")

        if language and language not in github_languages:
            github_languages.append(language)

    # Add GitHub languages to skills
    for language in github_languages:
        if language.lower() not in [skill.lower() for skill in skills]:
            skills.append(language)

    # Generate strengths
    strengths = []

    if "python" in [skill.lower() for skill in skills]:
        strengths.append("Strong Python development")

    if "machine learning" in resume_lower:
        strengths.append("Machine learning experience")

    if len(repos) >= 3:
        strengths.append("Good GitHub project activity")

    if "sql" in resume_lower:
        strengths.append("Database and SQL knowledge")

    # Skill gaps
    skill_gaps = []

    important_skills = [
        "docker",
        "react",
        "cloud",
        "kubernetes"
    ]

    for skill in important_skills:
        if skill not in resume_lower:
            skill_gaps.append(skill)

    # Recommendations
    recommendations = []

    if "docker" in skill_gaps:
        recommendations.append("Learn Docker and containerization")

    if "react" in skill_gaps:
        recommendations.append("Learn React for modern frontend development")

    if "cloud" in skill_gaps:
        recommendations.append("Learn cloud platforms such as AWS")

    if "kubernetes" in skill_gaps:
        recommendations.append("Learn Kubernetes after Docker")

    return {
        "skills": skills,
        "strengths": strengths,
        "skill_gaps": skill_gaps,
        "recommendations": recommendations
    }