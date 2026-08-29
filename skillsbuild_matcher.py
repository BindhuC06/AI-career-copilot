import json

with open("data/skillsbuild_courses.json", "r", encoding="utf-8") as file:
    data = json.load(file)

courses = data["courses"]


def normalize_skill(skill):
    return skill.strip().lower()


def score_course(course, missing_skills):
    normalized_missing = {
        normalize_skill(skill)
        for skill in missing_skills
    }

    course_skills = {
        normalize_skill(skill)
        for skill in course["skills_covered"]
    }

    return len(normalized_missing.intersection(course_skills))


def match_percentage(course, missing_skills):
    if not missing_skills:
        return 0

    score = score_course(course, missing_skills)

    return round((score / len(missing_skills)) * 100)


def get_matched_skills(course, missing_skills):
    normalized_missing = {
        normalize_skill(skill)
        for skill in missing_skills
    }

    matched = []

    for skill in course["skills_covered"]:
        if normalize_skill(skill) in normalized_missing:
            matched.append(skill)

    return matched


def find_matching_courses(missing_skills):
    matches = []

    for course in courses:
        score = score_course(course, missing_skills)

        if score > 0:
            matches.append((score, course))

    matches.sort(key=lambda item: item[0], reverse=True)

    return [course for score, course in matches]


def recommend_courses(missing_skills, limit=5, min_score=1):
    results = find_matching_courses(missing_skills)

    recommendations = []

    for course in results:
        score = score_course(course, missing_skills)

        if score < min_score:
            continue

        recommendation = {
            "title": course["title"],
            "matched_skills": get_matched_skills(
                course,
                missing_skills
            ),
            "match_score": score,
            "match_percentage": match_percentage(
                course,
                missing_skills
            ),
            "duration": course["duration"],
            "category": course["category"],
            "course_url": course["url"],
            "badge_url": course["badge_url"]
        }

        recommendations.append(recommendation)

    return recommendations[:limit]