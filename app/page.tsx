// app/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Sparkles, 
  UserCheck, 
  FileText, 
  ChevronRight, 
  ArrowRight,
  GraduationCap, 
  HeartPulse, 
  Sprout, 
  Home as HomeIcon,
  ShieldCheck,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const categories = [
  { name: "Agriculture", icon: Sprout, description: "Farmer subsidies, income support, and land development", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
  { name: "Healthcare", icon: HeartPulse, description: "Insurance cover, medical treatments, and child health benefits", color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" },
  { name: "Education", icon: GraduationCap, description: "Scholarships, school grants, and skills development training", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
  { name: "Housing", icon: HomeIcon, description: "Urban and rural affordable housing and construction assistance", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
];

const stats = [
  { value: "8+", label: "National Schemes Active" },
  { value: "100%", label: "Automated Rules Accuracy" },
  { value: "Instant", label: "Eligibility Calculation" },
  { value: "Printable", label: "Grievance Letter drafts" },
];

const features = [
  {
    title: "AI Civic Assistant",
    description: "Converse in natural language. Our ADK agent evaluates your profile, runs tools, and matches you to schemes instantly.",
    icon: Sparkles,
    href: "/assistant",
    cta: "Chat with Assistant"
  },
  {
    title: "Eligibility Engine",
    description: "Check your precise eligibility criteria dynamically based on age, income limits, occupation, state, and category.",
    icon: UserCheck,
    href: "/schemes",
    cta: "Calculate Eligibility"
  },
  {
    title: "Grievance Wizard",
    description: "Encountered a delay in welfare disbursement? Draft a formal, printable grievance letter to the public relations officer.",
    icon: FileText,
    href: "/complaint",
    cta: "Draft Complaint"
  }
];

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/schemes?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/schemes");
    }
  };

  const handleQuickTag = (tag: string) => {
    router.push(`/schemes?query=${encodeURIComponent(tag)}`);
  };

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/schemes?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-linear-to-b from-background via-muted/20 to-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 sm:px-8 max-w-7xl mx-auto w-full flex flex-col items-center justify-center text-center">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-1/4 left-1/2 -z-10 h-72 w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

        {/* Hero Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary mb-6 animate-pulse">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure & Verified Government Scheme Finder
        </div>

        {/* Hero Heading */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl leading-tight sm:leading-none mb-6">
          Access Welfare Schemes & <span className="text-primary bg-linear-to-r from-primary to-blue-500 bg-clip-text text-transparent">Voice Grievances</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          CivicAI uses advanced AI and the Model Context Protocol to help you find government support programs, verify dynamic eligibility, and draft official complaints.
        </p>

        {/* Search Bar Form */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl flex flex-col sm:flex-row gap-2.5 mb-5 shadow-xs p-1.5 rounded-2xl border border-border bg-card/60 backdrop-blur-xs">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search schemes e.g. farming subsidy, health insurance..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 w-full border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-base"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 px-6 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/95 transition-all">
            Find Schemes
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </form>

        {/* Quick Search Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-16 text-sm text-muted-foreground">
          <span>Popular:</span>
          {["PM Kisan", "Ayushman Bharat", "Scholarship", "Housing"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleQuickTag(tag)}
              className="px-3 py-1 rounded-full border border-border bg-card hover:bg-muted text-foreground transition-all duration-200"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full border border-border/60 bg-card/40 backdrop-blur-xs p-6 sm:p-8 rounded-3xl">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center text-center p-2 border-r border-border/40 last:border-none">
              <span className="text-3xl sm:text-4xl font-extrabold text-primary mb-1 tracking-tight">{stat.value}</span>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Browse by Category Section */}
      <section className="py-16 px-6 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">Browse by Category</h2>
            <p className="text-muted-foreground">Quickly check welfare schemes indexed by focal areas.</p>
          </div>
          <Button variant="ghost" onClick={() => router.push("/schemes")} className="group mt-4 md:mt-0 text-primary">
            View all categories
            <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card
                key={cat.name}
                onClick={() => handleCategoryClick(cat.name)}
                className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-300 group"
              >
                <CardContent className="p-6 flex flex-col items-start">
                  <div className={`p-3 rounded-xl mb-4 ${cat.color} transition-all duration-300 group-hover:scale-105`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Feature Spotlights Section */}
      <section className="py-16 px-6 sm:px-8 max-w-7xl mx-auto w-full border-t border-border/60">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">AI-Powered Civic Framework</h2>
          <p className="text-muted-foreground">
            Get personalized assistance, calculate criteria matches, and create grievance records using our three core features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="flex flex-col items-start p-8 rounded-3xl border border-border bg-card/45 hover:bg-card hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 transition-all duration-300 group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{feat.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6 text-sm flex-1">{feat.description}</p>
                <Button 
                  onClick={() => router.push(feat.href)} 
                  className="w-full justify-between rounded-xl font-semibold bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground group/btn transition-all duration-300"
                >
                  {feat.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Disclaimer / Banner */}
      <section className="py-16 px-6 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-primary rounded-3xl p-8 sm:p-12 text-primary-foreground flex flex-col md:flex-row items-center gap-8 shadow-xl bg-linear-to-r from-primary to-blue-900">
          <div className="space-y-4 flex-1">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-300 animate-bounce" />
              Need Quick Help?
            </h3>
            <p className="text-primary-foreground/80 leading-relaxed max-w-xl text-sm sm:text-base">
              Talk directly to our AI Assistant for custom guidance. Ask about PM Kisan, Ayushman Bharat, or other regional initiatives.
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={() => router.push("/assistant")}
            className="w-full md:w-auto bg-white text-primary hover:bg-white/95 rounded-xl font-extrabold h-12 px-8 flex items-center gap-2 shadow-md hover:scale-102 transition-all"
          >
            Launch Chatbot
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
