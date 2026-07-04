# api/test_tools.py
import unittest
import os
import sys

# Ensure project path is in system path for imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from mcp_server.tools import (
    load_schemes,
    fetch_scheme_details,
    check_eligibility,
    generate_complaint_letter
)

class TestCivicAITools(unittest.TestCase):

    def test_load_schemes(self):
        """Test that schemes database loads successfully and contains items."""
        schemes = load_schemes()
        self.assertIsInstance(schemes, list)
        self.assertGreater(len(schemes), 0, "Schemes list should not be empty")
        self.assertEqual(len(schemes), 8, "Schemes list should contain exactly 8 welfare schemes")

    def test_fetch_scheme_details(self):
        """Test retrieving details of specific schemes."""
        # Test valid scheme
        scheme = fetch_scheme_details("pm-kisan")
        self.assertIsNotNone(scheme)
        self.assertEqual(scheme["name"], "PM Kisan Samman Nidhi")
        
        # Test invalid scheme
        invalid_scheme = fetch_scheme_details("non-existent-scheme")
        self.assertIsNone(invalid_scheme)

    def test_check_eligibility_pm_kisan_eligible(self):
        """Test eligibility calculation for PM Kisan with an eligible profile."""
        result = check_eligibility(
            scheme_id="pm-kisan",
            age=35,
            income=150000.0,
            state="Madhya Pradesh",
            gender="Male",
            category="General",
            occupation="Farmer",
            is_landholder=True,
            land_size_hectares=1.5,
            is_income_tax_payer=False
        )
        self.assertTrue(result["isEligible"])
        self.assertIn("Aadhaar Card", result["missingDocuments"])
        self.assertIn("Landholding Document / RoR", result["missingDocuments"])

    def test_check_eligibility_pm_kisan_ineligible_taxpayer(self):
        """Test PM Kisan exclusion rules (income tax payers)."""
        result = check_eligibility(
            scheme_id="pm-kisan",
            age=35,
            income=150000.0,
            state="Madhya Pradesh",
            gender="Male",
            category="General",
            occupation="Farmer",
            is_landholder=True,
            land_size_hectares=1.5,
            is_income_tax_payer=True
        )
        self.assertFalse(result["isEligible"])
        self.assertTrue(any("tax payer" in reason.lower() for reason in result["reasons"]))

    def test_check_eligibility_pm_kisan_ineligible_land_size(self):
        """Test PM Kisan restriction on maximum landholding size (> 2 hectares)."""
        result = check_eligibility(
            scheme_id="pm-kisan",
            age=40,
            income=100000.0,
            state="Maharashtra",
            gender="Female",
            category="OBC",
            occupation="Farmer",
            is_landholder=True,
            land_size_hectares=3.5, # limit is 2.0 ha
            is_income_tax_payer=False
        )
        self.assertFalse(result["isEligible"])
        self.assertTrue(any("exceeds the limit" in reason.lower() for reason in result["reasons"]))

    def test_generate_complaint_letter(self):
        """Test formal grievance complaint letter drafting."""
        letter = generate_complaint_letter(
            scheme_name="PM Kisan",
            issue_type="Delay in benefit disbursement",
            user_name="Rajesh Patel",
            user_contact="9988776655",
            complaint_details="No installment received since November 2025.",
            department_name="Department of Agriculture",
            state="Gujarat",
            district="Anand"
        )
        self.assertIn("Rajesh Patel", letter)
        self.assertIn("9988776655", letter)
        self.assertIn("Anand, Gujarat", letter)
        self.assertIn("The Public Grievance Officer", letter)
        self.assertIn("PM Kisan", letter)

if __name__ == "__main__":
    unittest.main()
