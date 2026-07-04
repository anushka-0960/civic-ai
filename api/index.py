# api/index.py
import os
import sys
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Ensure the root project path is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from mcp_server.tools import (
    search_schemes,
    load_schemes,
    fetch_scheme_details,
    check_eligibility,
    generate_complaint_letter
)
from agent.agent import get_runner
from google.genai import types

# Load environment variables
load_dotenv()

# Initialize FastAPI App
app = FastAPI(title="CivicAI API Service", version="1.0.0")

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to convert Struct to standard dict/list
def convert_struct_to_dict(obj: Any) -> Any:
    if not obj:
        return {}
    if hasattr(obj, "to_dict"):
        return obj.to_dict()
    if hasattr(obj, "dict"):
        return obj.dict()
    try:
        return dict(obj)
    except Exception:
        return obj

# ----------------- Request/Response Models -----------------

class EligibilityRequest(BaseModel):
    scheme_id: str
    age: int
    income: float
    state: str
    gender: str
    category: str
    occupation: str
    is_landholder: bool
    land_size_hectares: Optional[float] = None
    is_income_tax_payer: bool = False

class ComplaintRequest(BaseModel):
    scheme_name: str
    issue_type: str
    user_name: str
    user_contact: str
    complaint_details: str
    department_name: str
    state: Optional[str] = None
    district: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    sessionId: str
    userId: Optional[str] = "default_user"

# ----------------- API Route Handlers -----------------

@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "CivicAI Service"}

@app.get("/api/schemes")
def list_and_search_schemes(query: str = "", state: Optional[str] = None, category: Optional[str] = None):
    """
    Search government schemes from the database based on keywords.
    Optionally filter by state and category.
    """
    try:
        # Clean input filters
        has_query = bool(query and query.strip())
        has_state = bool(state and state.strip() and state.lower() != "all")
        has_category = bool(category and category.strip() and category.lower() != "all")

        if not has_query and not has_state and not has_category:
            return load_schemes()

        results = search_schemes(
            query=query if has_query else "",
            state=state if has_state else None,
            category=None  # Bypass incorrect caste-based category filtering in mcp_server/tools.py
        )

        if has_category:
            results = [s for s in results if s.get("category", "").lower() == category.lower()]

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset failed to load: {str(e)}")

@app.get("/api/schemes/{scheme_id}")
def get_scheme(scheme_id: str):
    """Retrieves detailed information of a specific scheme using its ID."""
    try:
        scheme = fetch_scheme_details(scheme_id)
        if not scheme:
            raise HTTPException(status_code=404, detail=f"Scheme '{scheme_id}' not found.")
        return scheme
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset failed to load: {str(e)}")

@app.post("/api/eligibility")
def evaluate_eligibility(req: EligibilityRequest):
    """Checks the user's eligibility for a specific government scheme."""
    try:
        return check_eligibility(
            scheme_id=req.scheme_id,
            age=req.age,
            income=req.income,
            state=req.state,
            gender=req.gender,
            category=req.category,
            occupation=req.occupation,
            is_landholder=req.is_landholder,
            land_size_hectares=req.land_size_hectares,
            is_income_tax_payer=req.is_income_tax_payer
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset failed to load: {str(e)}")

@app.post("/api/complaint")
def generate_complaint(req: ComplaintRequest):
    """Generates a formal complaint letter addressed to a department."""
    letter = generate_complaint_letter(
        scheme_name=req.scheme_name,
        issue_type=req.issue_type,
        user_name=req.user_name,
        user_contact=req.user_contact,
        complaint_details=req.complaint_details,
        department_name=req.department_name,
        state=req.state,
        district=req.district
    )
    return {"letter": letter}

@app.post("/api/chat")
async def chat_interaction(req: ChatRequest):
    """
    Runs the Google ADK Agent asynchronously to process the chat message,
    captures the tool execution logs, and returns the final response.
    """
    # Check for valid Gemini API key
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key or gemini_key == "your_gemini_api_key_here":
        raise HTTPException(
            status_code=500,
            detail="Gemini API Key is missing or not configured. Please add a valid GEMINI_API_KEY to the .env file."
        )

    runner = get_runner()
    
    # Check if session exists in memory, create it if not
    session = await runner.session_service.get_session(
        app_name=runner.app_name,
        user_id=req.userId,
        session_id=req.sessionId
    )
    if not session:
        await runner.session_service.create_session(
            app_name=runner.app_name,
            user_id=req.userId,
            session_id=req.sessionId
        )
        
    # Format the input message for ADK
    content = types.Content(role="user", parts=[types.Part(text=req.message)])
    
    final_text = ""
    tool_calls_dict = {}
    tool_calls_list = []
    
    try:
        # Run ADK agent loop and process events
        async for event in runner.run_async(
            user_id=req.userId,
            session_id=req.sessionId,
            new_message=content
        ):
            # Accumulate text content
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        final_text += part.text
                    
                    # Track function (tool) calls
                    if part.function_call:
                        fc = part.function_call
                        args = convert_struct_to_dict(fc.args)
                        tool_call = {
                            "name": fc.name,
                            "args": args,
                            "result": None
                        }
                        tool_calls_list.append(tool_call)
                        # Store in map by tool name to associate results later
                        tool_calls_dict[fc.name] = tool_call

                    # Track function (tool) execution responses
                    if part.function_response:
                        fr = part.function_response
                        response_val = convert_struct_to_dict(fr.response)
                        
                        # Match with corresponding tool call
                        if fr.name in tool_calls_dict:
                            tool_calls_dict[fr.name]["result"] = response_val
                        else:
                            # Fallback if execution response arrives out of order
                            tool_calls_list.append({
                                "name": fr.name,
                                "args": {},
                                "result": response_val
                            })
                            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent Error: {str(e)}")
        
    return {
        "response": final_text,
        "toolCalls": tool_calls_list
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.index:app", host="127.0.0.1", port=8000, reload=True)
