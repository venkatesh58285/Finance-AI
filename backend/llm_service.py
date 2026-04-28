import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def generate_summary_with_llm(insights: dict):
    """
    Call Groq AI API to generate a summary.
    """
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return "GROQ_API_KEY is not set. Please set it in your .env file to generate LLM summaries."
        
    client = Groq(api_key=api_key)
    
    prompt = f"""
    Generate an extremely concise, bulleted executive summary (under 100 words total) based on the following insights:
    Trends: {insights.get('trends')}
    Anomalies: {insights.get('anomalies')}
    Profit Analysis: {insights.get('profit_analysis')}
    
    IMPORTANT: Wrap the 3 most critical numbers or phrases in <mark> tags to highlight them in yellow. Only use <mark> and basic HTML like <ul>, <li>, <b>, <p>. Do not use markdown format. Do not use asterisks.
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert financial analyst presenting to the board of directors. Your response must be short and use HTML tags."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.1-8b-instant", 
            temperature=0.4,
            max_tokens=200
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Error generating summary: {e}"
