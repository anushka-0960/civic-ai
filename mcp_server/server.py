from fastmcp import FastMCP
from mcp_server.tools import (
    search_schemes as search_schemes_logic,
    check_eligibility as check_eligibility_logic,
    fetch_scheme_details as fetch_scheme_details_logic,
    generate_complaint_letter as generate_complaint_letter_logic,
    get_document_checklist as get_document_checklist_logic,
    government_department_finder as government_department_finder_logic
)
from typing import Optional, List, Dict, Any

# Instantiate FastMCP server
mcp = FastMCP("CivicAI")

@mcp.tool()
def search_schemes(query: str, state: Optional[str] = None, category: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Search government schemes from the local database based on keywords matching.
    Optionally filter by state and category.
    """
    return search_schemes_logic(query, state, category)

@mcp.tool()
def check_eligibility(
    scheme_id: str,
    age: int,
    income: float,
    state: str,
    gender: str,
    category: str,
    occupation: str,
    is_landholder: bool,
    land_size_hectares: Optional[float] = None,
    is_income_tax_payer: bool = False
) -> Dict[str, Any]:
    """
    Checks the user eligibility for a specific government scheme.
    Requires demographic parameters like age, income, state, gender, etc.
    """
    return check_eligibility_logic(
        scheme_id=scheme_id,
        age=age,
        income=income,
        state=state,
        gender=gender,
        category=category,
        occupation=occupation,
        is_landholder=is_landholder,
        land_size_hectares=land_size_hectares,
        is_income_tax_payer=is_income_tax_payer
    )

@mcp.tool()
def fetch_scheme_details(scheme_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves full details of a specific scheme using its unique ID.
    """
    return fetch_scheme_details_logic(scheme_id)

@mcp.tool()
def generate_complaint_letter(
    scheme_name: str,
    issue_type: str,
    user_name: str,
    user_contact: str,
    complaint_details: str,
    department_name: str,
    state: Optional[str] = None,
    district: Optional[str] = None
) -> str:
    """
    Generates a formal, printable complaint letter addressed to a government department.
    """
    return generate_complaint_letter_logic(
        scheme_name=scheme_name,
        issue_type=issue_type,
        user_name=user_name,
        user_contact=user_contact,
        complaint_details=complaint_details,
        department_name=department_name,
        state=state,
        district=district
    )

@mcp.tool()
def document_checklist(scheme_id: str, category: str, is_landholder: bool) -> List[Dict[str, str]]:
    """
    Compiles the required documents for a scheme tailored to user attributes.
    """
    return get_document_checklist_logic(scheme_id, category, is_landholder)

@mcp.tool()
def government_department_finder(query: str) -> List[Dict[str, Any]]:
    """
    Searches for appropriate government departments, helpline links and contact details matching query keywords.
    """
    return government_department_finder_logic(query)

if __name__ == "__main__":
    mcp.run()
