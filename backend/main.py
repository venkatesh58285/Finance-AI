from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import uvicorn
import os

from data_loader import load_data_from_json, load_data_from_csv
from analysis import apply_rules, generate_structured_insights
from anomaly import detect_anomalies
from llm_service import generate_summary_with_llm

app = FastAPI(title="FinanceNarrate AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FinancialDataRecord(BaseModel):
    month: str
    revenue: float
    expenses: float

class FinancialDataInput(BaseModel):
    data: List[FinancialDataRecord]

@app.post("/generate-report")
async def generate_report_json(payload: FinancialDataInput):
    data_dicts = [record.dict() for record in payload.data]
    df = load_data_from_json(data_dicts)
    df = apply_rules(df)
    df = detect_anomalies(df)
    
    insights = generate_structured_insights(df)
    summary = generate_summary_with_llm(insights)
    
    # Clean df for JSON serialization
    df = df.fillna(0)
    
    return {
        "summary": summary,
        "insights": insights,
        "data": df.to_dict(orient="records")
    }

@app.post("/generate-report-csv")
async def generate_report_csv(file: UploadFile = File(...)):
    content = await file.read()
    df = load_data_from_csv(content.decode("utf-8"))
    df = apply_rules(df)
    df = detect_anomalies(df)
    
    insights = generate_structured_insights(df)
    summary = generate_summary_with_llm(insights)
    
    df = df.fillna(0)
    
    return {
        "summary": summary,
        "insights": insights,
        "data": df.to_dict(orient="records")
    }

# Ensure frontend directory exists

app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
def serve_frontend():
    return FileResponse("../frontend/index.html")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
