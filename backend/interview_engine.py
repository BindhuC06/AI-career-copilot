from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List, Dict, Any

class InterviewEvaluation(BaseModel):
    accuracy_score: int = Field(description="Score from 0-10 for technical accuracy of the answer (0 if generating the first question)")
    completeness_score: int = Field(description="Score from 0-10 for completeness (0 if generating first question)")
    clarity_score: int = Field(description="Score from 0-10 for clarity of communication (0 if generating first question)")
    feedback: str = Field(description="Actionable feedback for the user's latest answer. (Leave empty if generating first question)")
    next_question: str = Field(description="The next technical or situational interview question based on their resume. Leave empty if concluding.")
    is_concluded: bool = Field(description="True if the interview should end (usually after 7-8 questions).")

def generate_interview_response(resume_text: str, target_role: str, chat_history: List[Dict[str, str]], latest_user_answer: str = "") -> dict:
    """Adaptive Mock Interview Engine.
    Evaluates the user's answer and generates the next question dynamically.
    """
    # Initialize the LLM
    llm = ChatGoogleGenerativeAI(model="gemini-3.6-flash", temperature=0.6)
    parser = JsonOutputParser(pydantic_object=InterviewEvaluation)
    
    # Format chat history for context
    history_text = ""
    for msg in chat_history:
        history_text += f"{msg.get('role', 'INTERVIEWER').upper()}: {msg.get('content', '')}\n"
    
    if latest_user_answer:
        history_text += f"CANDIDATE: {latest_user_answer}\n"
    else:
        history_text += "(Start of interview. Generate the very first question based on their resume.)\n"
        
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert Senior Technical Interviewer for a '{target_role}' position. "
                   "You are conducting a mock interview with a candidate based on their resume:\n{resume_text}\n\n"
                   "Your tasks:\n"
                   "1. Evaluate the candidate's latest answer (if they provided one) across 3 rubrics: Accuracy, Completeness, and Clarity.\n"
                   "2. Provide constructive feedback.\n"
                   "3. Ask the next specific, technical question based on their resume or previous answers.\n"
                   "4. Conclude the interview gracefully after a total of 3 questions.\n\n"
                   "Output format:\n{format_instructions}"),
        ("human", "CURRENT INTERVIEW STATE:\n{history_text}\n\n"
                  "Provide your evaluation and the next question.")
    ])
    
    chain = prompt | llm | parser
    
    try:
        return chain.invoke({
            "target_role": target_role,
            "resume_text": resume_text[:2000], # Truncate to save context
            "history_text": history_text[-3000:], # Keep recent history
            "format_instructions": parser.get_format_instructions()
        })
    except Exception as e:
        print(f"Interview LLM Error: {e}")
        return {
            "accuracy_score": 0, "completeness_score": 0, "clarity_score": 0,
            "feedback": f"System Error: {str(e)}",
            "next_question": "",
            "is_concluded": True
        }
