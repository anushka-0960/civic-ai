import fs from 'fs';
import path from 'path';
import { Scheme } from '@/types';

export interface EligibilityParams {
  scheme_id: string;
  age: number;
  income: number;
  state: string;
  gender: string;
  category: string;
  occupation: string;
  is_landholder: boolean;
  land_size_hectares?: number | null;
  is_income_tax_payer?: boolean;
}

/**
 * Loads the schemes database from schemes.json
 */
export function loadSchemes(): Scheme[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'schemes.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`Schemes database file not found at: ${filePath}`);
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error: unknown) {
    console.error('Failed to load schemes:', error);
    throw new Error(`Failed to load schemes: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Retrieves full details of a specific scheme using its unique ID.
 */
export function fetchSchemeDetails(schemeId: string): Scheme | null {
  const schemes = loadSchemes();
  return schemes.find((s) => s.id === schemeId) || null;
}

/**
 * Search government schemes based on query text matching name, description, benefits, or category.
 * Optionally filter by state or category.
 */
export function searchSchemes(
  query: string,
  state?: string,
  category?: string,
  casteCategoryFilter: boolean = false
): Scheme[] {
  const schemes = loadSchemes();
  const queryLower = query.trim().toLowerCase();
  const hasQuery = queryLower !== '';
  const hasState = state && state.trim() !== '' && state.trim().toLowerCase() !== 'all';
  const hasCategory = category && category.trim() !== '' && category.trim().toLowerCase() !== 'all';

  const results: Scheme[] = [];

  for (const s of schemes) {
    // 1. Query search
    if (hasQuery) {
      const match =
        s.name.toLowerCase().includes(queryLower) ||
        s.description.toLowerCase().includes(queryLower) ||
        s.benefits.toLowerCase().includes(queryLower) ||
        s.category.toLowerCase().includes(queryLower) ||
        s.department.toLowerCase().includes(queryLower);
      if (!match) continue;
    }

    // 2. State filtering
    if (hasState) {
      const stateLower = state!.trim().toLowerCase();
      const allowedStates = s.eligibility.allowedStates;
      const isAll = allowedStates.some((st) => st.toLowerCase() === 'all');
      const isStateIncluded = allowedStates.some((st) => st.toLowerCase() === stateLower);
      if (!isAll && !isStateIncluded) continue;
    }

    // 3. Category filtering
    if (hasCategory) {
      const categoryLower = category!.trim().toLowerCase();
      if (casteCategoryFilter) {
        // checks both scheme category and caste-based allowedCategories
        const isSchemeCatMatch = s.category.toLowerCase() === categoryLower;
        const allowedCategories = s.eligibility.allowedCategories;
        const isCasteCatMatch =
          allowedCategories.some((c) => c.toLowerCase() === 'all') ||
          allowedCategories.some((c) => c.toLowerCase() === categoryLower);
        if (!isSchemeCatMatch && !isCasteCatMatch) continue;
      } else {
        // Strict scheme category match
        if (s.category.toLowerCase() !== categoryLower) continue;
      }
    }

    results.push(s);
  }

  return results;
}

/**
 * Evaluates whether a citizen is eligible for a specific scheme based on their profile.
 * Returns status and detailed matching reasons.
 */
export function checkEligibility(params: EligibilityParams) {
  const schemes = loadSchemes();
  const scheme = schemes.find((s) => s.id === params.scheme_id);

  if (!scheme) {
    return {
      isEligible: false,
      reasons: ["Scheme not found in database."],
      missingDocuments: []
    };
  }

  const rules = scheme.eligibility;
  const reasons: string[] = [];
  let isEligible = true;

  // 1. Age check
  if (params.age < rules.minAge) {
    isEligible = false;
    reasons.push(`Age ${params.age} is below the minimum required age of ${rules.minAge}.`);
  } else if (params.age > rules.maxAge) {
    isEligible = false;
    reasons.push(`Age ${params.age} exceeds the maximum allowed age of ${rules.maxAge}.`);
  } else {
    reasons.push(`Age matches requirements (Required: ${rules.minAge}-${rules.maxAge} years).`);
  }

  // 2. Income check
  if (rules.maxIncome !== null) {
    if (params.income > rules.maxIncome) {
      isEligible = false;
      const formattedIncome = "₹" + params.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const formattedLimit = "₹" + rules.maxIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      reasons.push(`Annual income of ${formattedIncome} exceeds the limit of ${formattedLimit}.`);
    } else {
      const formattedLimit = "₹" + rules.maxIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      reasons.push(`Income matches requirements (Limit: ${formattedLimit}).`);
    }
  }

  // 3. State check
  const allowedStates = rules.allowedStates;
  if (!allowedStates.some((s) => s.toLowerCase() === 'all')) {
    const stateListLower = allowedStates.map((s) => s.toLowerCase());
    if (!stateListLower.includes(params.state.toLowerCase())) {
      isEligible = false;
      reasons.push(`Scheme is not active in your state '${params.state}' (Active in: ${allowedStates.join(', ')}).`);
    } else {
      reasons.push(`Active in your state '${params.state}'.`);
    }
  }

  // 4. Gender check
  const allowedGenders = rules.allowedGenders;
  if (!allowedGenders.some((g) => g.toLowerCase() === 'all')) {
    const genderListLower = allowedGenders.map((g) => g.toLowerCase());
    if (!genderListLower.includes(params.gender.toLowerCase())) {
      isEligible = false;
      reasons.push(`Scheme only applies to: ${allowedGenders.join(', ')} gender(s).`);
    } else {
      reasons.push(`Gender matches requirements.`);
    }
  }

  // 5. Category check
  const allowedCategories = rules.allowedCategories;
  if (!allowedCategories.some((c) => c.toLowerCase() === 'all')) {
    const catListLower = allowedCategories.map((c) => c.toLowerCase());
    if (!catListLower.includes(params.category.toLowerCase())) {
      isEligible = false;
      reasons.push(`Scheme applies to categories: ${allowedCategories.join(', ')} (Your category: ${params.category}).`);
    } else {
      reasons.push(`Category matches requirements.`);
    }
  }

  // 6. Occupation check
  const reqOccupations = rules.requiredOccupations;
  if (!reqOccupations.some((o) => o.toLowerCase() === 'all')) {
    const occListLower = reqOccupations.map((o) => o.toLowerCase());
    if (!occListLower.includes(params.occupation.toLowerCase())) {
      isEligible = false;
      reasons.push(`Required occupations: ${reqOccupations.join(', ')} (Your occupation: ${params.occupation}).`);
    } else {
      reasons.push(`Occupation matches requirements.`);
    }
  }

  // 7. Landholder check
  if (rules.landholderOnly) {
    if (!params.is_landholder) {
      isEligible = false;
      reasons.push("Scheme requires you to be a cultivable landholder.");
    } else {
      reasons.push("Landholder criteria met.");
      // Land size check
      const maxLand = rules.maxLandSizeHectares;
      if (maxLand !== null) {
        const userLand = params.land_size_hectares !== undefined && params.land_size_hectares !== null ? params.land_size_hectares : 0.0;
        if (userLand > maxLand) {
          isEligible = false;
          reasons.push(`Landholding size ${userLand} hectares exceeds the limit of ${maxLand} hectares.`);
        } else {
          reasons.push(`Land size of ${userLand} hectares is within requirements (Limit: ${maxLand} ha).`);
        }
      }
    }
  }

  // 8. Taxpayer check
  if (rules.incomeTaxPayerExcluded) {
    if (params.is_income_tax_payer) {
      isEligible = false;
      reasons.push("Income tax payers are excluded from this benefit.");
    } else {
      reasons.push("Non-taxpayer eligibility confirmed.");
    }
  }

  // Generate required document list based on profile
  const checklist: string[] = [];
  for (const doc of scheme.requiredDocuments) {
    // Caste Certificate condition
    if (doc.name.toLowerCase() === 'caste certificate' && params.category.toLowerCase() === 'general') {
      continue;
    }
    // Land doc condition
    if (doc.name.toLowerCase().includes('land') && !params.is_landholder) {
      continue;
    }
    checklist.push(doc.name);
  }

  return {
    isEligible,
    reasons,
    missingDocuments: isEligible ? checklist : []
  };
}

/**
 * Generates a formal, printable complaint letter addressed to a government department.
 */
export function generateComplaintLetter(params: {
  scheme_name: string;
  issue_type: string;
  user_name: string;
  user_contact: string;
  complaint_details: string;
  department_name: string;
  state?: string | null;
  district?: string | null;
}) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const senderLocation = `${params.district || '[District]'}, ${params.state || '[State]'}`;

  const letter = `Date: ${currentDate}

From:
${params.user_name}
Contact: ${params.user_contact}
Address: ${senderLocation}

To:
The Public Grievance Officer,
${params.department_name}
Government of India / State Government

Subject: Formal Grievance regarding ${params.issue_type} under the ${params.scheme_name} Scheme

Respected Officer,

I am writing to formally bring to your attention a serious grievance concerning the execution and benefits of the ${params.scheme_name} scheme.

As an eligible beneficiary of this scheme, I have encountered the following issue(s):
${params.issue_type}

Details of the Complaint:
${params.complaint_details}

Due to this issue, I have been unable to fully access the benefits of the scheme. I request your esteemed department to review my registration, verify my eligible documents, and resolve this grievance at the earliest.

I have attached all necessary identity proofs and registration credentials for your reference. I look forward to your prompt response.

Thanking you in anticipation.

Sincerely,

(Signature)

${params.user_name}`;

  return letter.trim();
}

/**
 * Compiles the required documents for a scheme tailored to user attributes.
 */
export function getDocumentChecklist(schemeId: string, category: string, isLandholder: boolean) {
  const scheme = fetchSchemeDetails(schemeId);
  if (!scheme) return [];

  const filtered = [];
  for (const doc of scheme.requiredDocuments) {
    // Skip caste certificate for general categories
    if (doc.name.toLowerCase().includes('caste') && category.toLowerCase() === 'general') {
      continue;
    }
    // Skip land documents if not a landholder
    if (doc.name.toLowerCase().includes('land') && !isLandholder) {
      continue;
    }
    filtered.push(doc);
  }
  return filtered;
}

/**
 * Searches for appropriate government departments, helpline links and contact details matching query keywords.
 */
export function governmentDepartmentFinder(query: string) {
  const schemes = loadSchemes();
  const departments: Record<string, { name: string; portalUrl: string; associatedSchemes: string[] }> = {};

  // Extract unique departments with links from schemes
  for (const s of schemes) {
    const dept = s.department;
    if (!departments[dept]) {
      departments[dept] = {
        name: dept,
        portalUrl: s.portalUrl,
        associatedSchemes: []
      };
    }
    departments[dept].associatedSchemes.push(s.name);
  }

  const results = [];
  const queryLower = query.toLowerCase();
  for (const [name, data] of Object.entries(departments)) {
    const matchesName = name.toLowerCase().includes(queryLower);
    const matchesScheme = data.associatedSchemes.some((s) => s.toLowerCase().includes(queryLower));
    if (matchesName || matchesScheme) {
      results.push(data);
    }
  }

  return results;
}
