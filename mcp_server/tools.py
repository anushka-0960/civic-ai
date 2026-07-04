import os
import json
from typing import List, Dict, Any, Optional

# Robust database path resolution
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SCHEMES_PATH = os.path.join(os.path.dirname(CURRENT_DIR), "data", "schemes.json")

def load_schemes() -> List[Dict[str, Any]]:
    """Loads the schemes database from schemes.json."""
    if not os.path.exists(SCHEMES_PATH):
        raise FileNotFoundError(f"Schemes database file not found at: {SCHEMES_PATH}")
    try:
        with open(SCHEMES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"Schemes database contains invalid JSON: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Failed to load schemes: {str(e)}")

def search_schemes(query: str, state: Optional[str] = None, category: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Search government schemes based on query text matching name, description, benefits, or category.
    Optionally filter by state or category.
    """
    schemes = load_schemes()
    results = []
    query_lower = query.lower()

    for s in schemes:
        # Match text fields
        text_matches = (
            query_lower in s["name"].lower() or
            query_lower in s["description"].lower() or
            query_lower in s["benefits"].lower() or
            query_lower in s["category"].lower() or
            query_lower in s["department"].lower()
        )
        
        if not text_matches and query != "":
            continue
            
        # Match state
        if state and state.lower() != "all" and state != "":
            allowed_states = s["eligibility"]["allowedStates"]
            if "All" not in allowed_states and state.lower() not in [st.lower() for st in allowed_states]:
                continue
                
        # Match category (checks both scheme category and caste-based allowedCategories)
        if category and category.lower() != "all" and category != "":
            is_scheme_cat_match = s["category"].lower() == category.lower()
            allowed_categories = s["eligibility"]["allowedCategories"]
            is_caste_cat_match = "All" in allowed_categories or category.lower() in [c.lower() for c in allowed_categories]
            if not is_scheme_cat_match and not is_caste_cat_match:
                continue
                
        results.append(s)
        
    return results

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
    Evaluates whether a citizen is eligible for a specific scheme based on their profile.
    Returns status and detailed matching reasons.
    """
    schemes = load_schemes()
    scheme = next((s for s in schemes if s["id"] == scheme_id), None)
    
    if not scheme:
        return {
            "isEligible": False,
            "reasons": ["Scheme not found in database."],
            "missingDocuments": []
        }
        
    rules = scheme["eligibility"]
    reasons = []
    is_eligible = True
    
    # 1. Age check
    if age < rules["minAge"]:
        is_eligible = False
        reasons.append(f"Age {age} is below the minimum required age of {rules['minAge']}.")
    elif age > rules["maxAge"]:
        is_eligible = False
        reasons.append(f"Age {age} exceeds the maximum allowed age of {rules['maxAge']}.")
    else:
        reasons.append(f"Age matches requirements (Required: {rules['minAge']}-{rules['maxAge']} years).")
        
    # 2. Income check
    if rules["maxIncome"] is not None:
        if income > rules["maxIncome"]:
            is_eligible = False
            reasons.append(f"Annual income of ₹{income:,.2f} exceeds the limit of ₹{rules['maxIncome']:,.2f}.")
        else:
            reasons.append(f"Income matches requirements (Limit: ₹{rules['maxIncome']:,.2f}).")
            
    # 3. State check
    allowed_states = rules["allowedStates"]
    if "All" not in allowed_states:
        state_list_lower = [s.lower() for s in allowed_states]
        if state.lower() not in state_list_lower:
            is_eligible = False
            reasons.append(f"Scheme is not active in your state '{state}' (Active in: {', '.join(allowed_states)}).")
        else:
            reasons.append(f"Active in your state '{state}'.")
            
    # 4. Gender check
    allowed_genders = rules["allowedGenders"]
    if "All" not in allowed_genders:
        gender_list_lower = [g.lower() for g in allowed_genders]
        if gender.lower() not in gender_list_lower:
            is_eligible = False
            reasons.append(f"Scheme only applies to: {', '.join(allowed_genders)} gender(s).")
        else:
            reasons.append(f"Gender matches requirements.")
            
    # 5. Category check
    allowed_categories = rules["allowedCategories"]
    if "All" not in allowed_categories:
        cat_list_lower = [c.lower() for c in allowed_categories]
        if category.lower() not in cat_list_lower:
            is_eligible = False
            reasons.append(f"Scheme applies to categories: {', '.join(allowed_categories)} (Your category: {category}).")
        else:
            reasons.append(f"Category matches requirements.")
            
    # 6. Occupation check
    req_occupations = rules["requiredOccupations"]
    if "All" not in req_occupations:
        occ_list_lower = [o.lower() for o in req_occupations]
        if occupation.lower() not in occ_list_lower:
            is_eligible = False
            reasons.append(f"Required occupations: {', '.join(req_occupations)} (Your occupation: {occupation}).")
        else:
            reasons.append(f"Occupation matches requirements.")
            
    # 7. Landholder check
    if rules["landholderOnly"]:
        if not is_landholder:
            is_eligible = False
            reasons.append("Scheme requires you to be a cultivable landholder.")
        else:
            reasons.append("Landholder criteria met.")
            # Land size check
            max_land = rules["maxLandSizeHectares"]
            if max_land is not None:
                user_land = land_size_hectares if land_size_hectares is not None else 0.0
                if user_land > max_land:
                    is_eligible = False
                    reasons.append(f"Landholding size {user_land} hectares exceeds the limit of {max_land} hectares.")
                else:
                    reasons.append(f"Land size of {user_land} hectares is within requirements (Limit: {max_land} ha).")
                    
    # 8. Taxpayer check
    if rules["incomeTaxPayerExcluded"]:
        if is_income_tax_payer:
            is_eligible = False
            reasons.append("Income tax payers are excluded from this benefit.")
        else:
            reasons.append("Non-taxpayer eligibility confirmed.")
            
    # Generate required document list based on profile
    checklist = []
    for doc in scheme["requiredDocuments"]:
        # Caste Certificate condition
        if doc["name"].lower() == "caste certificate" and category.lower() == "general":
            continue
        # Land doc condition
        if "land" in doc["name"].lower() and not is_landholder:
            continue
        checklist.append(doc["name"])
        
    return {
        "isEligible": is_eligible,
        "reasons": reasons,
        "missingDocuments": checklist if is_eligible else []
    }

def fetch_scheme_details(scheme_id: str) -> Optional[Dict[str, Any]]:
    """Fetches full information for a single scheme by its unique ID."""
    schemes = load_schemes()
    return next((s for s in schemes if s["id"] == scheme_id), None)

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
    from datetime import datetime
    current_date = datetime.now().strftime("%B %d, %Y")
    
    sender_location = f"{district or '[District]'}, {state or '[State]'}"
    
    letter = f"""Date: {current_date}

From:
{user_name}
Contact: {user_contact}
Address: {sender_location}

To:
The Public Grievance Officer,
{department_name}
Government of India / State Government

Subject: Formal Grievance regarding {issue_type} under the {scheme_name} Scheme

Respected Officer,

I am writing to formally bring to your attention a serious grievance concerning the execution and benefits of the {scheme_name} scheme.

As an eligible beneficiary of this scheme, I have encountered the following issue(s):
{issue_type}

Details of the Complaint:
{complaint_details}

Due to this issue, I have been unable to fully access the benefits of the scheme. I request your esteemed department to review my registration, verify my eligible documents, and resolve this grievance at the earliest.

I have attached all necessary identity proofs and registration credentials for your reference. I look forward to your prompt response.

Thanking you in anticipation.

Sincerely,

(Signature)

{user_name}
"""
    return letter.strip()

def get_document_checklist(scheme_id: str, category: str, is_landholder: bool) -> List[Dict[str, str]]:
    """
    Generates a filtered checklist of documents for a specific scheme based on user criteria.
    """
    scheme = fetch_scheme_details(scheme_id)
    if not scheme:
        return []
        
    filtered = []
    for doc in scheme["requiredDocuments"]:
        # Skip caste certificate for general categories
        if "caste" in doc["name"].lower() and category.lower() == "general":
            continue
        # Skip land documents if not a landholder
        if "land" in doc["name"].lower() and not is_landholder:
            continue
        filtered.append(doc)
        
    return filtered

def government_department_finder(query: str) -> List[Dict[str, str]]:
    """
    Finds matching departments, details, and official links based on keywords.
    """
    schemes = load_schemes()
    departments = {}
    
    # Extract unique departments with links from schemes
    for s in schemes:
        dept = s["department"]
        if dept not in departments:
            departments[dept] = {
                "name": dept,
                "portalUrl": s["portalUrl"],
                "associatedSchemes": []
            }
        departments[dept]["associatedSchemes"].append(s["name"])
        
    results = []
    query_lower = query.lower()
    for name, data in departments.items():
        if query_lower in name.lower() or any(query_lower in s.lower() for s in data["associatedSchemes"]):
            results.append(data)
            
    return results
