// utils/security.ts

/**
 * Regex patterns representing common jailbreaks, roleplays, or instructions override intents.
 */
const ADVERSARIAL_PATTERNS = [
  /ignore\s+(?:all\s+)?previous\s+instructions/i,
  /system\s+prompt/i,
  /bypass\s+restrictions/i,
  /jailbreak/i,
  /forget\s+(?:your\s+)?guidelines/i,
  /you\s+are\s+no\s+longer\s+an\s+ai/i,
  /override\s+safety/i,
  /ignore\s+(?:the\s+)?above/i,
  /respond\s+only\s+with/i
];

/**
 * Validates a user query against known prompt injection and adversarial patterns.
 * 
 * @param text The input message text to check.
 * @returns true if the query is safe, false if it looks like an exploit.
 */
export function isSanitized(text: string): boolean {
  if (!text) return true;
  for (const pattern of ADVERSARIAL_PATTERNS) {
    if (pattern.test(text)) {
      return false;
    }
  }
  return true;
}

/**
 * Strips script tags, HTML event attributes, and javascript pseudo-protocols
 * to prevent XSS exploits in rendered Markdown.
 * 
 * @param htmlOrMarkdown The raw generated text.
 * @returns Sanitized text safely rendered as HTML.
 */
export function sanitizeOutput(htmlOrMarkdown: string): string {
  if (!htmlOrMarkdown) return "";
  return htmlOrMarkdown
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Strip <script>...</script>
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")                            // Strip onload=, onclick=, etc.
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript\s*:/gi, "no-js:");                           // Neutralize javascript: hrefs
}
