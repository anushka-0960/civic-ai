/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { isSanitized, sanitizeOutput } from '@/utils/security';
import {
  searchSchemes,
  checkEligibility,
  fetchSchemeDetails,
  generateComplaintLetter,
  getDocumentChecklist,
  governmentDepartmentFinder
} from '@/lib/schemes';

export const dynamic = 'force-dynamic';

// System instructions copied from agent/instructions.py
const SYSTEM_INSTRUCTION = `You are CivicAI, an expert AI assistant dedicated to helping Indian citizens navigate government welfare schemes and voice grievances.

Your primary capabilities include:
1. Searching for welfare schemes matching user needs (education, farming, healthcare, housing, etc.).
2. Evaluating citizen eligibility for specific schemes based on demographics (age, income, occupation, land size, etc.).
3. Providing customized document checklists for applications.
4. Locating government departments and helplines.
5. Generating printable formal complaint letters for civic grievances.

CRITICAL BEHAVIORAL RULES:
- Always base your answers on actual data retrieved using your tools. Do not hallucinate scheme details, website URLs, or eligibility rules.
- If the user asks about a scheme that is not in the database, search for it using the \`search_schemes\` tool. If no matching scheme is found, clearly state that the scheme is not in the database and offer to search for other related schemes.
- Always use the tools available to you to check eligibility (\`check_eligibility\`) and retrieve document checklists (\`document_checklist\`) rather than guessing.
- Format all lists, eligibility criteria, and process steps using clean, premium Markdown formatting (bullet points, bold text, tables where appropriate).
- When generating complaint letters, use the \`generate_complaint_letter\` tool to draft the text, then present the output clearly to the user.
- Keep a professional, empathetic, and civic-minded tone. Explain government terms in simple language for citizens.
- If user input is missing required fields for checking eligibility (e.g. state, age, income), politely ask the user to provide them.`;

// In-memory session store for chat histories
const sessions = new Map<string, any[]>();

const geminiTools = [
  {
    functionDeclarations: [
      {
        name: 'search_schemes',
        description: 'Search government schemes from the local database based on keywords matching. Optionally filter by state and category.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Keyword search query matching name, description, benefits, category, or department.' },
            state: { type: 'STRING', description: 'Optional state filter' },
            category: { type: 'STRING', description: 'Optional category filter' }
          },
          required: ['query']
        }
      },
      {
        name: 'check_eligibility',
        description: 'Checks the user eligibility for a specific government scheme. Requires demographic parameters like age, income, state, gender, etc.',
        parameters: {
          type: 'OBJECT',
          properties: {
            scheme_id: { type: 'STRING', description: 'Unique ID of the scheme.' },
            age: { type: 'INTEGER', description: 'Citizen age in years.' },
            income: { type: 'NUMBER', description: 'Citizen annual income in INR.' },
            state: { type: 'STRING', description: 'Citizen home state.' },
            gender: { type: 'STRING', description: 'Citizen gender.' },
            category: { type: 'STRING', description: 'Citizen category (General, OBC, SC, ST, etc).' },
            occupation: { type: 'STRING', description: 'Citizen occupation.' },
            is_landholder: { type: 'BOOLEAN', description: 'Whether citizen holds cultivable land.' },
            land_size_hectares: { type: 'NUMBER', description: 'Land size in hectares if landholder.' },
            is_income_tax_payer: { type: 'BOOLEAN', description: 'Whether citizen pays income tax.' }
          },
          required: ['scheme_id', 'age', 'income', 'state', 'gender', 'category', 'occupation', 'is_landholder']
        }
      },
      {
        name: 'fetch_scheme_details',
        description: 'Retrieves full details of a specific scheme using its unique ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            scheme_id: { type: 'STRING', description: 'Unique ID of the scheme.' }
          },
          required: ['scheme_id']
        }
      },
      {
        name: 'generate_complaint_letter',
        description: 'Generates a formal, printable complaint letter addressed to a government department.',
        parameters: {
          type: 'OBJECT',
          properties: {
            scheme_name: { type: 'STRING', description: 'Name of the scheme.' },
            issue_type: { type: 'STRING', description: 'Type of grievance/issue.' },
            user_name: { type: 'STRING', description: 'Name of the complainant.' },
            user_contact: { type: 'STRING', description: 'Contact details of complainant.' },
            complaint_details: { type: 'STRING', description: 'Detailed description of the issue.' },
            department_name: { type: 'STRING', description: 'Department handling the scheme.' },
            state: { type: 'STRING', description: 'Optional state of complainant.' },
            district: { type: 'STRING', description: 'Optional district of complainant.' }
          },
          required: ['scheme_name', 'issue_type', 'user_name', 'user_contact', 'complaint_details', 'department_name']
        }
      },
      {
        name: 'document_checklist',
        description: 'Compiles the required documents for a scheme tailored to user attributes.',
        parameters: {
          type: 'OBJECT',
          properties: {
            scheme_id: { type: 'STRING', description: 'Unique ID of the scheme.' },
            category: { type: 'STRING', description: 'Citizen category.' },
            is_landholder: { type: 'BOOLEAN', description: 'Whether citizen holds land.' }
          },
          required: ['scheme_id', 'category', 'is_landholder']
        }
      },
      {
        name: 'government_department_finder',
        description: 'Searches for appropriate government departments, helpline links and contact details matching query keywords.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Search term for department name or associated schemes.' }
          },
          required: ['query']
        }
      }
    ]
  }
];

async function executeTool(name: string, args: any) {
  switch (name) {
    case 'search_schemes':
      return searchSchemes(args.query || '', args.state || '', args.category || '', true);
    case 'check_eligibility':
      return checkEligibility({
        scheme_id: args.scheme_id,
        age: Number(args.age),
        income: Number(args.income),
        state: args.state,
        gender: args.gender,
        category: args.category,
        occupation: args.occupation,
        is_landholder: Boolean(args.is_landholder),
        land_size_hectares: args.land_size_hectares !== undefined && args.land_size_hectares !== null ? Number(args.land_size_hectares) : null,
        is_income_tax_payer: Boolean(args.is_income_tax_payer)
      });
    case 'fetch_scheme_details':
      return fetchSchemeDetails(args.scheme_id);
    case 'generate_complaint_letter':
      return generateComplaintLetter({
        scheme_name: args.scheme_name,
        issue_type: args.issue_type,
        user_name: args.user_name,
        user_contact: args.user_contact,
        complaint_details: args.complaint_details,
        department_name: args.department_name,
        state: args.state,
        district: args.district
      });
    case 'document_checklist':
      return getDocumentChecklist(args.scheme_id, args.category, Boolean(args.is_landholder));
    case 'government_department_finder':
      return governmentDepartmentFinder(args.query || '');
    default:
      return { error: `Tool ${name} is not implemented.` };
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const limitResult = rateLimit(ip, 15, 60000); // 15 requests per minute

  if (!limitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
    return NextResponse.json(
      { error: 'Gemini API Key is missing or not configured. Please add a valid GEMINI_API_KEY to the .env file.' },
      { status: 500 }
    );
  }

  try {
    const { message, sessionId } = await request.json();

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Missing message or sessionId fields.' },
        { status: 400 }
      );
    }

    // Input Security Check: Prompt Injection Filter
    if (!isSanitized(message)) {
      return NextResponse.json({
        response: 'Security Alert: Adversarial intent detected in request. Please ask standard civic or scheme questions.',
        toolCalls: []
      });
    }

    // Retrieve or initialize conversation history
    const history = sessions.get(sessionId) || [];
    history.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const executedToolCalls: any[] = [];
    let loopCount = 0;
    const maxLoops = 10;
    let finalResponseText = '';

    while (loopCount < maxLoops) {
      loopCount++;

      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          },
          contents: history,
          tools: geminiTools
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Gemini API call failed:', errorText);
        return NextResponse.json(
          { error: `Gemini service error: ${res.statusText}` },
          { status: res.status }
        );
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      if (!candidate) {
        return NextResponse.json(
          { error: 'Gemini API returned no candidates.' },
          { status: 500 }
        );
      }

      const modelContent = candidate.content;
      if (!modelContent || !modelContent.parts) {
        return NextResponse.json(
          { error: 'Gemini API returned empty content.' },
          { status: 500 }
        );
      }

      // Add model's message to history
      history.push(modelContent);

      const hasFunctionCalls = modelContent.parts.some((p: any) => p.functionCall);

      if (hasFunctionCalls) {
        const functionResponseParts = [];
        for (const part of modelContent.parts) {
          if (part.functionCall) {
            const { name, args } = part.functionCall;
            const result = await executeTool(name, args);
            executedToolCalls.push({ name, args, result });
            functionResponseParts.push({
              functionResponse: {
                name,
                response: { result }
              }
            });
          }
        }

        // Add function response content to history
        history.push({
          role: 'function',
          parts: functionResponseParts
        });
      } else {
        // No function calls: get the final text and break loop
        finalResponseText = modelContent.parts.map((p: any) => p.text || '').join('');
        break;
      }
    }

    // Save history back to session store
    sessions.set(sessionId, history);

    // Sanitize generated text output
    if (finalResponseText) {
      finalResponseText = sanitizeOutput(finalResponseText);
    }

    return NextResponse.json({
      response: finalResponseText,
      toolCalls: executedToolCalls
    });

  } catch (error) {
    console.error('Error in Next.js chat route handler:', error);
    return NextResponse.json(
      { error: 'Internal server error processing chat session.' },
      { status: 500 }
    );
  }
}
