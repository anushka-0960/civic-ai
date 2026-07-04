export interface SchemeEligibility {
  minAge: number;
  maxAge: number;
  maxIncome: number | null;
  allowedStates: string[];
  allowedGenders: string[];
  allowedCategories: string[];
  requiredOccupations: string[];
  landholderOnly: boolean;
  maxLandSizeHectares: number | null;
  incomeTaxPayerExcluded: boolean;
}

export interface RequiredDocument {
  name: string;
  description: string;
}

export interface Scheme {
  id: string;
  name: string;
  category: string;
  description: string;
  benefits: string;
  department: string;
  portalUrl: string;
  eligibility: SchemeEligibility;
  requiredDocuments: RequiredDocument[];
  applicationProcess: string[];
}

export interface UserProfile {
  age: number;
  income: number;
  state: string;
  gender: string;
  category: string; // 'General' | 'OBC' | 'SC' | 'ST'
  occupation: string;
  isLandholder: boolean;
  landSizeHectares?: number;
  isIncomeTaxPayer: boolean;
}

export interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
  missingDocuments: string[];
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
}

export interface ComplaintDetails {
  schemeName: string;
  issueType: string;
  userName: string;
  userContact: string;
  complaintDetails: string;
  departmentName: string;
  state?: string;
  district?: string;
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
}
