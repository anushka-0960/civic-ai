// app/assistant/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Wrench, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolCall } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

const suggestionChips = [
  "Am I eligible for PM Kisan?",
  "What healthcare schemes exist?",
  "Help me draft a complaint letter",
  "Is there a land size limit for farming benefits?"
];

// Helper to format inline bold text and lists in Markdown
function parseInline(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return <strong key={idx} className="font-extrabold text-foreground">{part}</strong>;
    }
    return part;
  });
}

function formatMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    if (line.startsWith("### ")) {
      return <h4 key={idx} className="font-bold text-foreground text-sm mt-3 mb-1.5">{parseInline(line.substring(4))}</h4>;
    }
    if (line.startsWith("## ")) {
      return <h3 key={idx} className="font-extrabold text-foreground text-base mt-4 mb-2">{parseInline(line.substring(3))}</h3>;
    }
    if (line.startsWith("# ")) {
      return <h2 key={idx} className="font-extrabold text-foreground text-lg mt-5 mb-2.5">{parseInline(line.substring(2))}</h2>;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <li key={idx} className="list-disc pl-5 text-sm mb-1 leading-relaxed text-muted-foreground">
          {parseInline(line.substring(2))}
        </li>
      );
    }
    const numberedMatch = line.match(/^(\d+)\.\s(.*)/);
    if (numberedMatch) {
      return (
        <li key={idx} className="list-decimal pl-5 text-sm mb-1 leading-relaxed text-muted-foreground">
          {parseInline(numberedMatch[2])}
        </li>
      );
    }
    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }
    return <p key={idx} className="text-sm leading-relaxed text-muted-foreground mb-2">{parseInline(line)}</p>;
  });
}

function generateId() {
  return Math.random().toString(36).substring(7);
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am CivicAI, your AI assistant. I can search welfare schemes, evaluate your eligibility, map out required document checklists, or help you draft official complaint letters. What can I help you with today?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedToolIndex, setExpandedToolIndex] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate unique session ID on mount
  useEffect(() => {
    const id = generateId();
    setTimeout(() => setSessionId(id), 0);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsgId = generateId();
    const assistantMsgId = generateId();

    // Append User Message
    const newMessages = [
      ...messages,
      { id: userMsgId, role: "user" as const, content: text }
    ];
    setMessages(newMessages);
    setInputValue("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId,
          userId: "civic_user"
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([
          ...newMessages,
          {
            id: assistantMsgId,
            role: "assistant",
            content: data.response,
            toolCalls: data.toolCalls
          }
        ]);
      } else {
        const errText = await response.text();
        let displayError = "An error occurred while calling the assistant service.";
        
        // Handle Gemini API Key validation failure gracefully in UI
        if (errText.includes("API key not valid") || errText.includes("INVALID_ARGUMENT")) {
          displayError = "Configuration Alert: The assistant could not connect to Gemini because a valid API key is missing. Please add a valid `GEMINI_API_KEY` to the `.env` file in the project folder to enable assistant chat.";
        }

        setMessages([
          ...newMessages,
          {
            id: assistantMsgId,
            role: "assistant",
            content: displayError
          }
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([
        ...newMessages,
        {
          id: assistantMsgId,
          role: "assistant",
          content: "Sorry, I am unable to connect to the CivicAI server. Please verify both FastAPI and Next.js servers are running."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleResetChat = () => {
    const id = generateId();
    setSessionId(id);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I am CivicAI, your AI assistant. I can search welfare schemes, evaluate your eligibility, map out required document checklists, or help you draft official complaint letters. What can I help you with today?"
      }
    ]);
  };

  const toggleToolLogs = (id: string) => {
    setExpandedToolIndex(expandedToolIndex === id ? null : id);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 gap-4">
      {/* Assistant Title Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">AI Assistant Chat</h1>
            <span className="text-xs text-muted-foreground">Orchestrated with Google ADK & FastMCP Tools</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleResetChat} className="rounded-lg text-xs gap-1.5 h-8">
          <RefreshCw className="h-3 w-3" />
          Reset Chat
        </Button>
      </div>

      {/* Suggestion Chips Banner (Visible only at welcome screen) */}
      {messages.length === 1 && !loading && (
        <div className="flex flex-col gap-2 shrink-0 animate-fade-in">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Suggested Prompts:</span>
          <div className="flex flex-wrap gap-2">
            {suggestionChips.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSendMessage(chip)}
                className="text-xs font-medium text-foreground text-left px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/20 transition-all duration-200"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Thread Panel */}
      <div className="flex-1 overflow-y-auto border border-border bg-card/45 rounded-3xl p-4 sm:p-6 shadow-inner space-y-6 min-h-0">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
              {/* Bubble Avatar */}
              <div className={`flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl border ${
                isUser ? "bg-primary border-primary text-primary-foreground" : "bg-muted border-border text-muted-foreground"
              }`}>
                {isUser ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
              </div>

              {/* Bubble Content Body */}
              <div className="space-y-3 flex flex-col">
                {/* Bubble Text Card */}
                <div className={`px-4.5 py-3 rounded-2xl border text-sm leading-relaxed ${
                  isUser 
                    ? "bg-primary/5 border-primary/20 text-foreground rounded-tr-none" 
                    : "bg-card border-border text-muted-foreground rounded-tl-none"
                }`}>
                  {isUser ? parseInline(msg.content) : formatMarkdown(msg.content)}
                </div>

                {/* Render Tool Log Notifications (Under Assistant Bubble) */}
                {!isUser && msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-1.5 self-start w-full min-w-[280px]">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1.5">Executed Actions:</div>
                    {msg.toolCalls.map((tool, idx) => {
                      const toolId = `${msg.id}-${idx}`;
                      const isExpanded = expandedToolIndex === toolId;
                      return (
                        <div key={idx} className="rounded-lg border border-border/80 bg-muted/40 overflow-hidden text-xs">
                          {/* Log Header Expander button */}
                          <button
                            onClick={() => toggleToolLogs(toolId)}
                            className="w-full flex items-center justify-between p-2.5 hover:bg-muted text-muted-foreground text-left transition-colors font-mono"
                          >
                            <span className="flex items-center gap-1.5 text-foreground font-semibold">
                              <Wrench className="h-3.5 w-3.5 text-primary shrink-0" />
                              mcp_tool: {tool.name}()
                            </span>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>

                          {/* Expanded Details Pane */}
                          {isExpanded && (
                            <div className="p-3 border-t border-border bg-card/60 font-mono text-[11px] leading-relaxed space-y-2 max-w-full overflow-x-auto select-text">
                              <div>
                                <strong className="text-foreground text-[10px] block mb-0.5">Parameters:</strong>
                                <pre className="p-2 rounded bg-muted/75 overflow-x-auto text-[10px] text-muted-foreground">
                                  {JSON.stringify(tool.args, null, 2)}
                                </pre>
                              </div>
                              {!!tool.result && (
                                <div>
                                  <strong className="text-foreground text-[10px] block mb-0.5">Return Data:</strong>
                                  <pre className="p-2 rounded bg-muted/75 overflow-x-auto text-[10px] text-muted-foreground max-h-[140px] overflow-y-auto">
                                    {JSON.stringify(tool.result, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted border border-border text-muted-foreground">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/40 border border-border/60 rounded-2xl rounded-tl-none text-xs text-muted-foreground font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              CivicAI is reasoning and checking tools...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Text Input Form */}
      <form onSubmit={handleFormSubmit} className="flex gap-2 shrink-0">
        <Input
          type="text"
          placeholder="Ask a question about government welfare schemes or grievance rules..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={loading}
          className="h-11 flex-1 border-border bg-card focus-visible:ring-1 focus-visible:ring-primary rounded-xl text-sm"
        />
        <Button type="submit" disabled={loading || !inputValue.trim()} className="h-11 px-4.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all">
          <Send className="h-4 w-4" />
          <span className="sr-only">Send Message</span>
        </Button>
      </form>
    </div>
  );
}
