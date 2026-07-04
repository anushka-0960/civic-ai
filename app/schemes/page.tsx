// app/schemes/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Filter, 
  Award, 
  MapPin, 
  Users, 
  ExternalLink, 
  FileCheck,
  CheckCircle,
  XCircle,
  HelpCircle,
  Calculator,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Scheme, EligibilityResult } from "@/types";

const categories = ["All", "Agriculture", "Healthcare", "Education", "Housing", "Women & Girl Child", "Pension & Social Security", "Business & Entrepreneurship", "Food Security"];

function SchemesContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const initialCategory = searchParams.get("category") || "All";

  // State Management
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedState, setSelectedState] = useState("All");
  const [loading, setLoading] = useState(true);

  // Modal Dialogs State
  const [detailsScheme, setDetailsScheme] = useState<Scheme | null>(null);
  const [calculatorScheme, setCalculatorScheme] = useState<Scheme | null>(null);

  // Calculator Form State
  const [calcAge, setCalcAge] = useState<number>(25);
  const [calcIncome, setCalcIncome] = useState<number>(150000);
  const [calcState, setCalcState] = useState<string>("Madhya Pradesh");
  const [calcGender, setCalcGender] = useState<string>("Male");
  const [calcCategory, setCalcCategory] = useState<string>("General");
  const [calcOccupation, setCalcOccupation] = useState<string>("Farmer");
  const [calcIsLandholder, setCalcIsLandholder] = useState<boolean>(true);
  const [calcLandSize, setCalcLandSize] = useState<number>(1.5);
  const [calcIsTaxpayer, setCalcIsTaxpayer] = useState<boolean>(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcResult, setCalcResult] = useState<EligibilityResult | null>(null);

  // Fetch schemes from client API bridge
  useEffect(() => {
    async function loadAllSchemes() {
      try {
        const response = await fetch("/api/schemes");
        if (response.ok) {
          const data = await response.json();
          setSchemes(data);
        }
      } catch (error) {
        console.error("Error fetching schemes from Next API:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAllSchemes();
  }, []);

  // Filter schemes in-memory based on search query, category, and state
  const filteredSchemes = React.useMemo(() => {
    let result = schemes;

    // Filter by Category
    if (selectedCategory !== "All") {
      if (selectedCategory.toLowerCase() === "education") {
        // Fallback for Education (e.g. Sukanya Samriddhi Yojana or any scheme mentioning education/student/girl child)
        result = result.filter(
          (s) =>
            s.category.toLowerCase() === "education" ||
            s.description.toLowerCase().includes("education") ||
            s.benefits.toLowerCase().includes("education") ||
            s.description.toLowerCase().includes("girl child") ||
            s.name.toLowerCase().includes("education")
        );
      } else {
        result = result.filter(
          (s) => s.category.toLowerCase() === selectedCategory.toLowerCase()
        );
      }
    }

    // Filter by State
    if (selectedState !== "All") {
      result = result.filter((s) => {
        const allowed = s.eligibility.allowedStates;
        return allowed.includes("All") || allowed.some(st => st.toLowerCase() === selectedState.toLowerCase());
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.benefits.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
      );
    }

    return result;
  }, [schemes, searchQuery, selectedCategory, selectedState]);

  const handleOpenCalculator = (scheme: Scheme) => {
    setCalculatorScheme(scheme);
    setCalcResult(null); // Reset results
    // Pre-populate occupation logic based on scheme
    if (scheme.id === "pm-kisan") {
      setCalcOccupation("Farmer");
      setCalcIsLandholder(true);
    } else {
      setCalcOccupation("Student");
      setCalcIsLandholder(false);
    }
  };

  const handleRunCalculator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculatorScheme) return;
    setCalcLoading(true);
    setCalcResult(null);

    const payload = {
      scheme_id: calculatorScheme.id,
      age: calcAge,
      income: calcIncome,
      state: calcState,
      gender: calcGender,
      category: calcCategory,
      occupation: calcOccupation,
      is_landholder: calcIsLandholder,
      land_size_hectares: calcIsLandholder ? calcLandSize : null,
      is_income_tax_payer: calcIsTaxpayer
    };

    try {
      const res = await fetch("/api/eligibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const resultData = await res.json();
        setCalcResult(resultData);
      } else {
        const errorText = await res.text();
        console.error("Calculator API error:", errorText);
      }
    } catch (error) {
      console.error("Error invoking Eligibility Calculator:", error);
    } finally {
      setCalcLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-8 py-12 w-full flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2 max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          National Welfare Scheme Finder
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Search the verified central welfare database. Open the calculator on any scheme to dynamically verify your eligibility profile and documents checklist.
        </p>
      </div>

      {/* Filters & Search Block */}
      <div className="flex flex-col gap-4 p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-xs">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by keyword, scheme name, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 w-full bg-background border-border text-base focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
          />
        </div>

        {/* Horizontal Category Tabs & State Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-t border-border/60 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-2">
              <Filter className="h-3.5 w-3.5" />
              CATEGORY:
            </div>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start lg:self-auto">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">State Filter:</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              {["All", "Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Uttar Pradesh", "West Bengal"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 w-full rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Empty State */}
          {filteredSchemes.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-3xl bg-card/20 max-w-lg mx-auto w-full flex flex-col items-center gap-3">
              <HelpCircle className="h-10 w-10 text-muted-foreground/60" />
              <h3 className="text-lg font-bold text-foreground">No Schemes Found</h3>
              <p className="text-sm text-muted-foreground px-6 leading-relaxed">
                We couldn&apos;t find any government schemes matching &quot;{searchQuery}&quot; under category &quot;{selectedCategory}&quot;. Try widening your search terms.
              </p>
              <Button onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setSelectedState("All"); }} className="mt-2 rounded-xl">
                Reset All Filters
              </Button>
            </div>
          ) : (
            /* Schemes Card Grid */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSchemes.map((scheme) => (
                <Card key={scheme.id} className="flex flex-col border border-border bg-card/65 hover:border-primary/30 hover:shadow-xs transition-all duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {scheme.category}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 max-w-[200px] truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {scheme.eligibility.allowedStates.includes("All") ? "Active Across India" : `Active in ${scheme.eligibility.allowedStates[0]}`}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {scheme.name}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground font-medium pt-1">
                      {scheme.department}
                    </span>
                  </CardHeader>

                  <CardContent className="pb-6 flex-1 flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {scheme.description}
                    </p>
                    
                    {/* Benefits Preview */}
                    <div className="p-3.5 rounded-xl bg-muted/65 border border-border/40 text-sm">
                      <strong className="text-foreground block text-xs tracking-wider uppercase mb-1">Scheme Benefit:</strong>
                      <span className="text-muted-foreground font-medium">{scheme.benefits}</span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 border-t border-border/40 bg-muted/20 p-6 flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setDetailsScheme(scheme)}
                      className="w-full sm:flex-1 rounded-xl font-semibold border-border hover:bg-muted text-foreground transition-all h-10"
                    >
                      View Process & Docs
                    </Button>
                    <Button 
                      onClick={() => handleOpenCalculator(scheme)}
                      className="w-full sm:flex-1 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 h-10"
                    >
                      <Calculator className="h-4 w-4" />
                      Check Eligibility
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ----------------- MODAL DIALOGS ----------------- */}

      {/* 1. Scheme Details Modal */}
      <Dialog open={detailsScheme !== null} onOpenChange={(open) => !open && setDetailsScheme(null)}>
        <DialogContent className="max-w-2xl border border-border rounded-2xl bg-card">
          {detailsScheme && (
            <>
              <DialogHeader className="pb-4 border-b border-border/60">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {detailsScheme.category}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">{detailsScheme.department}</span>
                </div>
                <DialogTitle className="text-2xl font-bold text-foreground pr-6">{detailsScheme.name}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {detailsScheme.description}
                </DialogDescription>
              </DialogHeader>

              {/* Scrollable Modal Content */}
              <div className="space-y-6 py-4 max-h-[50vh] overflow-y-auto pr-2">
                {/* Benefits */}
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Award className="h-4.5 w-4.5 text-primary" />
                    Detailed Benefits
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                    {detailsScheme.benefits}
                  </p>
                </div>

                {/* Application Process */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <FileCheck className="h-4.5 w-4.5 text-primary" />
                    How to Apply
                  </h4>
                  <ol className="list-decimal pl-10 text-sm text-muted-foreground space-y-2 leading-relaxed">
                    {detailsScheme.applicationProcess.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>

                {/* Required Documents */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Users className="h-4.5 w-4.5 text-primary" />
                    Standard Documents Checklist
                  </h4>
                  <ul className="list-disc pl-10 text-sm text-muted-foreground space-y-2">
                    {detailsScheme.requiredDocuments.map((doc, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <strong className="text-foreground">{doc.name}</strong>: {doc.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer Buttons */}
              <DialogFooter className="pt-4 border-t border-border/60 flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={() => {
                    const s = detailsScheme;
                    setDetailsScheme(null);
                    setTimeout(() => handleOpenCalculator(s), 200);
                  }}
                  className="rounded-xl w-full sm:w-auto font-semibold"
                >
                  Run Eligibility Check
                </Button>
                <a 
                  href={detailsScheme.portalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-secondary px-4 text-sm font-semibold text-secondary-foreground hover:bg-muted border border-border gap-1.5 transition-all text-center"
                >
                  Go to Official Portal
                  <ExternalLink className="h-4 w-4" />
                </a>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. Eligibility Calculator Dialog */}
      <Dialog open={calculatorScheme !== null} onOpenChange={(open) => !open && setCalculatorScheme(null)}>
        <DialogContent className="max-w-2xl border border-border rounded-2xl bg-card">
          {calculatorScheme && (
            <>
              <DialogHeader className="pb-3 border-b border-border/60">
                <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Calculator className="h-5.5 w-5.5 text-primary" />
                  Eligibility Calculator
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Verify eligibility for <strong className="text-foreground font-semibold">{calculatorScheme.name}</strong> based on your demographic profile.
                </DialogDescription>
              </DialogHeader>

              {/* Scrollable form/results container */}
              <div className="max-h-[58vh] overflow-y-auto py-4 pr-2">
                {/* Form fields if not computed, or showing results alongside */}
                {!calcResult ? (
                  <form onSubmit={handleRunCalculator} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Age Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Age (Years)</label>
                        <Input
                          type="number"
                          min={1}
                          max={120}
                          value={calcAge}
                          onChange={(e) => setCalcAge(Number(e.target.value))}
                          className="h-10 border-border rounded-xl"
                          required
                        />
                      </div>

                      {/* Income Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Annual Income (₹)</label>
                        <Input
                          type="number"
                          min={0}
                          value={calcIncome}
                          onChange={(e) => setCalcIncome(Number(e.target.value))}
                          className="h-10 border-border rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* State Dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">State</label>
                        <select
                          value={calcState}
                          onChange={(e) => setCalcState(e.target.value)}
                          className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-primary"
                        >
                          {["Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Uttar Pradesh", "West Bengal", "Other"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Gender Dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Gender</label>
                        <select
                          value={calcGender}
                          onChange={(e) => setCalcGender(e.target.value)}
                          className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-primary"
                        >
                          {["Male", "Female", "Other"].map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      {/* Category Dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Caste Category</label>
                        <select
                          value={calcCategory}
                          onChange={(e) => setCalcCategory(e.target.value)}
                          className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-primary"
                        >
                          {["General", "OBC", "SC", "ST"].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Occupation Dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Occupation</label>
                        <select
                          value={calcOccupation}
                          onChange={(e) => setCalcOccupation(e.target.value)}
                          className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-primary"
                        >
                          {["Farmer", "Student", "Unemployed", "Self Employed", "Salaried", "Business Owner", "Senior Citizen", "Other"].map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </div>

                      {/* Taxpayer Check */}
                      <div className="flex items-center gap-3 h-full pt-6">
                        <input
                          type="checkbox"
                          id="taxpayer"
                          checked={calcIsTaxpayer}
                          onChange={(e) => setCalcIsTaxpayer(e.target.checked)}
                          className="h-4 w-4 rounded-sm border-border bg-background text-primary focus:ring-primary"
                        />
                        <label htmlFor="taxpayer" className="text-sm font-semibold text-foreground cursor-pointer select-none">
                          Income Tax Payer
                        </label>
                      </div>
                    </div>

                    {/* Landholder Section */}
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">Cultivable Landholder</span>
                        <input
                          type="checkbox"
                          checked={calcIsLandholder}
                          onChange={(e) => setCalcIsLandholder(e.target.checked)}
                          className="h-4 w-4 rounded-sm border-border bg-background text-primary focus:ring-primary"
                        />
                      </div>
                      
                      {calcIsLandholder && (
                        <div className="space-y-1.5 animate-fade-in">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Land size (Hectares)</label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={calcLandSize}
                            onChange={(e) => setCalcLandSize(Number(e.target.value))}
                            className="h-10 border-border bg-background rounded-xl"
                            required
                          />
                        </div>
                      )}
                    </div>

                    <Button type="submit" disabled={calcLoading} className="w-full rounded-xl font-semibold h-11">
                      {calcLoading ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin mr-1.5" />
                          Evaluating eligibility profile...
                        </>
                      ) : "Verify My Eligibility"}
                    </Button>
                  </form>
                ) : (
                  /* Display Results */
                  <div className="space-y-6">
                    {/* Status Alert Banner */}
                    {calcResult.isEligible ? (
                      <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-900 dark:text-emerald-300 flex items-start gap-3">
                        <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-extrabold text-base mb-1">Congratulations! You are eligible.</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Based on your profile, you satisfy the basic eligibility filters for this welfare scheme. See the documents checklist below.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-900 dark:text-rose-300 flex items-start gap-3">
                        <XCircle className="h-6 w-6 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-extrabold text-base mb-1">Ineligible Profile</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Unfortunately, you do not meet the criteria requirements for this welfare scheme. See the specific mismatches highlighted below.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Criteria Details list */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">Demographic Matching Reasons</h4>
                      <ul className="space-y-2 border border-border bg-muted/20 p-4 rounded-2xl text-sm text-muted-foreground leading-relaxed">
                        {calcResult.reasons.map((reason: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-1 shrink-0">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Custom Documents checklist for eligible users */}
                    {calcResult.isEligible && calcResult.missingDocuments && calcResult.missingDocuments.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-1.5">
                          <FileCheck className="h-4.5 w-4.5 text-primary" />
                          Customized Required Documents
                        </h4>
                        <div className="border border-border bg-card p-4 rounded-2xl space-y-2 text-sm text-muted-foreground">
                          {calcResult.missingDocuments.map((docName: string, index: number) => (
                            <div key={index} className="flex items-center gap-2.5 py-1.5 border-b border-border/40 last:border-none">
                              <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                              <span className="font-semibold text-foreground">{docName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dialog Footer Actions */}
              <DialogFooter className="pt-3 border-t border-border/60 flex flex-col sm:flex-row gap-2">
                {calcResult ? (
                  <>
                    <Button onClick={() => setCalcResult(null)} className="rounded-xl w-full sm:w-auto font-semibold">
                      Modify Input Profile
                    </Button>
                    <Button variant="outline" onClick={() => setCalculatorScheme(null)} className="rounded-xl w-full sm:w-auto font-semibold">
                      Close Calculator
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setCalculatorScheme(null)} className="rounded-xl w-full sm:w-auto font-semibold">
                    Cancel Check
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Suspense } from "react";

export default function SchemesPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-6 sm:px-8 py-24 w-full flex flex-col gap-4 justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-semibold">Loading Scheme Finder...</p>
      </div>
    }>
      <SchemesContent />
    </Suspense>
  );
}
