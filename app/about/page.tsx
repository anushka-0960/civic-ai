// app/about/page.tsx
"use client";

import React from "react";
import { 
  Cpu, 
  Database, 
  Layers, 
  Terminal, 
  ShieldCheck, 
  Workflow, 
  Sparkles,
  Info
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const techStack = [
  { name: "Next.js 15", category: "Frontend", desc: "React Framework, App Router & Route Handlers" },
  { name: "Python 3.13", category: "Backend", desc: "Backend runtime environment & dependency wrapper" },
  { name: "FastAPI", category: "API Middleware", desc: "Python web routing service & payload validation" },
  { name: "Google ADK", category: "Agent Framework", desc: "Orchestrates reasoning loops & MCP toolset connections" },
  { name: "Gemini 2.5 Flash", category: "AI LLM Model", desc: "LLM powering system instructions & tool execution calls" },
  { name: "FastMCP", category: "Tool Server", desc: "Standardized Model Context Protocol server exposing functions" },
];

const steps = [
  {
    phase: "1. Next.js Client Interface",
    desc: "Citizen searches for a scheme or initiates a chat message.",
    icon: Layers,
    color: "border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-950/20"
  },
  {
    phase: "2. API Route Handlers",
    desc: "Validates rate limits and sanitizes query input against prompt injections.",
    icon: ShieldCheck,
    color: "border-emerald-500 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
  },
  {
    phase: "3. FastAPI Router Service",
    desc: "Forwards requests on port 8000 and resolves schema objects.",
    icon: Terminal,
    color: "border-purple-500 text-purple-500 bg-purple-50 dark:bg-purple-950/20"
  },
  {
    phase: "4. Google ADK Agent Layer",
    desc: "Injects guardrails & feeds history and query to Gemini 2.5 Flash.",
    icon: Sparkles,
    color: "border-rose-500 text-rose-500 bg-rose-50 dark:bg-rose-950/20"
  },
  {
    phase: "5. FastMCP Tool Server",
    desc: "Stdio subprocess executes local tools (eligibility checks, database search).",
    icon: Workflow,
    color: "border-amber-500 text-amber-500 bg-amber-50 dark:bg-amber-950/20"
  },
  {
    phase: "6. Schemes JSON Database",
    desc: "Queries/updates local schemes metadata, document rules, and processes.",
    icon: Database,
    color: "border-indigo-500 text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
  }
];

export default function About() {
  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-8 py-16 w-full flex flex-col gap-16">
      {/* Page Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          About CivicAI Architecture
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          CivicAI bridges the gap between complex government terminology and citizens. 
          By combining modular Python-based AI agents with Next.js web frameworks, we provide 
          secure, instant, and verified welfare insights.
        </p>
      </section>

      {/* Interactive Request Flow / Architecture Diagram */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 justify-center mb-10">
          <Layers className="h-6 w-6 text-primary" />
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Interactive Request Lifecycle</h2>
        </div>

        {/* Visual Request Flow list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card key={idx} className="relative hover:shadow-md transition-all border-border duration-300">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg border ${step.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-foreground text-base tracking-tight">{step.phase}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  
                  {/* Visual numbering */}
                  <span className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/30">0{idx + 1}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Connection flow description banner */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex gap-4 items-start max-w-3xl mx-auto">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-primary text-sm">System Interoperability (TypeScript + Python)</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              For local hosting, Next.js handles route checking (port 3000) and redirects requests to the Python FastAPI router (port 8000). 
              The Google ADK Agent communicates with the local FastMCP server using JSON-RPC messages over standard input/output (stdio), 
              safely encapsulating file queries.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack Details */}
      <section className="space-y-8 border-t border-border/60 pt-16">
        <div className="flex items-center gap-3 justify-center mb-10">
          <Cpu className="h-6 w-6 text-primary" />
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Technology Blueprint</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {techStack.map((tech) => (
            <div key={tech.name} className="flex flex-col gap-2 p-6 rounded-2xl border border-border bg-card/50">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-foreground tracking-tight">{tech.name}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">{tech.category}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{tech.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
