from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List, Dict, Any

# Define the required JSON output structure from the LLM-gemini 3.6 flash
class AnalysisOutput(BaseModel):
    skills: List[str] = Field(description="Comprehensive list of technical skills found in the resume and GitHub repository.")
    strengths: List[str] = Field(description="3 to 4 key technical strengths of the candidate.")
    skill_gaps: List[str] = Field(description="Critical skills the candidate is missing for the target role.")
    recommendations: List[str] = Field(description="Actionable steps and specific technologies to learn to bridge the skill gaps.")
    readiness_score: int = Field(description="Estimated job readiness score from 0 to 100 based on the target role.")

def analyze_candidate(resume_text: str, github_data: Dict[str, Any], target_role: str) -> Dict[str, Any]:
    #Analyzes resume and GitHub data using Google Gemini API and provide inputs.

    # Initializing Google Gemini
    llm = ChatGoogleGenerativeAI(model="gemini-3.6-flash", temperature=0.2)
    
    #JSON parser for the output format
    parser = JsonOutputParser(pydantic_object=AnalysisOutput)
    
    #the prompt template
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert AI Technical Recruiter and Career Coach. "
                   "Your job is to critically analyze a candidate's resume and GitHub portfolio "
                   "against their desired target role of '{target_role}'.\n\n"
                   "Follow these strict formatting rules:\n{format_instructions}"),
        ("human", "CANDIDATE RESUME:\n{resume_text}\n\n"
                  "CANDIDATE GITHUB REPOSITORIES:\n{github_data}\n\n"
                  "Provide a comprehensive technical analysis.")
    ])
    #Chaining them together
    chain = prompt | llm | parser
    try:
        # Simplify GitHub data to look for relavent context window and focus on tech stack
        repos = github_data.get("repos", [])
        github_summary = [
            f"Repo: {r.get('name')}, Language: {r.get('language')}, Stars: {r.get('stars')}" 
            for r in repos if r.get('language')
        ]
        #invoke the LLM
        result = chain.invoke({
            "target_role": target_role,
            "resume_text": resume_text[:4000], # Truncating to avoid context limits
            "github_data": "\n".join(github_summary)[:2000],
            "format_instructions": parser.get_format_instructions()
        })
        return result
        
    except Exception as e:
        print(f"LLM Error: {e}")
        # Fallback dictionary if the LLM fails.
        return {
            "skills": ["Error extracting skills...LLM Error"],
            "strengths": [],
            "skill_gaps": ["Cannot reach LLM."],
            "recommendations": [f"Technical Error: {str(e)}"],
            "readiness_score": 0
        }