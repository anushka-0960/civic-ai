// app/complaint/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  User, 
  Building, 
  ArrowLeft, 
  ArrowRight, 
  Printer, 
  Copy, 
  Check, 
  Loader2, 
  Landmark,
  FilePenLine,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Scheme } from "@/types";

const issueTypes = [
  "Delay in benefit disbursement",
  "Incorrect benefit amount credited",
  "Welfare registration application rejected without grounds",
  "Document verification pending for over 30 days",
  "Welfare portal access issues / account blocked",
  "Bribe requested by local officer",
  "Other general civic grievance"
];

export default function ComplaintPage() {
  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);

  // Schemes database list for select dropdown
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loadingSchemes, setLoadingSchemes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [userName, setUserName] = useState("");
  const [userContact, setUserContact] = useState("");
  const [userState, setUserState] = useState("Madhya Pradesh");
  const [userDistrict, setUserDistrict] = useState("");
  
  const [selectedSchemeId, setSelectedSchemeId] = useState("");
  const [schemeName, setSchemeName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [issueType, setIssueType] = useState(issueTypes[0]);
  const [complaintDetails, setComplaintDetails] = useState("");

  const [loadingLetter, setLoadingLetter] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [copied, setCopied] = useState(false);

  // Load schemes at mount
  useEffect(() => {
    async function loadSchemes() {
      try {
        setError(null);
        const res = await fetch("/api/schemes");
        if (res.ok) {
          const data = await res.json();
          setSchemes(data);
          if (data.length > 0) {
            setSelectedSchemeId(data[0].id);
            setSchemeName(data[0].name);
            setDepartmentName(data[0].department);
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || "Failed to fetch schemes from backend service.");
        }
      } catch (error) {
        console.error("Error loading schemes:", error);
        setError("CivicAI backend service is currently unreachable.");
      } finally {
        setLoadingSchemes(false);
      }
    }
    loadSchemes();
  }, []);

  // When selected scheme changes, auto-fill details
  const handleSchemeChange = (schemeId: string) => {
    setSelectedSchemeId(schemeId);
    if (schemeId === "custom") {
      setSchemeName("");
      setDepartmentName("");
    } else {
      const match = schemes.find((s) => s.id === schemeId);
      if (match) {
        setSchemeName(match.name);
        setDepartmentName(match.department);
      }
    }
  };

  const handleNext = () => {
    // Basic fields validation
    if (currentStep === 1) {
      if (!userName.trim() || !userContact.trim() || !userDistrict.trim()) {
        toast.error("Please fill in all profile fields.");
        return;
      }
    } else if (currentStep === 2) {
      if (!schemeName.trim() || !departmentName.trim()) {
        toast.error("Please fill in scheme and department details.");
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleGenerateLetter = async () => {
    if (!complaintDetails.trim()) {
      toast.error("Please provide the specific details of your complaint.");
      return;
    }
    setLoadingLetter(true);

    const payload = {
      scheme_name: schemeName,
      issue_type: issueType,
      user_name: userName,
      user_contact: userContact,
      complaint_details: complaintDetails,
      department_name: departmentName,
      state: userState,
      district: userDistrict
    };

    try {
      const res = await fetch("/api/complaint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        setGeneratedLetter(data.letter);
        setCurrentStep(4);
      } else {
        toast.error("Failed to generate complaint letter draft.");
      }
    } catch (error) {
      console.error("Error generating complaint letter:", error);
      toast.error("Unreachable backend service.");
    } finally {
      setLoadingLetter(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    toast.success("Draft copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setComplaintDetails("");
    setGeneratedLetter("");
  };

  return (
    <div className="mx-auto max-w-4xl px-6 sm:px-8 py-12 w-full flex flex-col gap-8">
      {/* Print styles override to print ONLY the letter card sheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-letter, #printable-letter * {
            visibility: visible !important;
          }
          #printable-letter {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
        }
      `}} />

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Grievance Complaint Letter Wizard
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Walk through the compiler step-by-step to draft a formal grievance letter addressed to the public relations officer.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="flex items-center justify-between w-full border-b border-border/60 pb-6 mb-2">
        {[
          { label: "Profile", step: 1, icon: User },
          { label: "Scheme Details", step: 2, icon: Landmark },
          { label: "Grievance Text", step: 3, icon: FilePenLine },
          { label: "Print & Copy", step: 4, icon: FileText }
        ].map((item) => {
          const Icon = item.icon;
          const isCompleted = currentStep > item.step;
          const isActive = currentStep === item.step;
          return (
            <div key={item.step} className="flex items-center gap-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold border transition-all duration-300 ${
                isCompleted 
                  ? "bg-emerald-500 border-emerald-500 text-white" 
                  : isActive 
                    ? "bg-primary border-primary text-primary-foreground shadow-xs" 
                    : "border-border text-muted-foreground bg-card"
              }`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className={`hidden sm:inline text-sm font-semibold ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
              {item.step < 4 && (
                <div className="hidden sm:block h-px w-8 bg-border/60 mx-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Wizard Form Container */}
      <Card className="border-border bg-card/65 backdrop-blur-xs">
        <CardContent className="p-8">
          
          {/* STEP 1: Citizen Profile */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Step 1: Citizen Profile Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Full Name</label>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="h-11 rounded-xl border-border bg-background"
                    required
                  />
                </div>

                {/* Contact Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact Number / Phone</label>
                  <Input
                    type="text"
                    placeholder="Enter mobile number"
                    value={userContact}
                    onChange={(e) => setUserContact(e.target.value)}
                    className="h-11 rounded-xl border-border bg-background"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* State Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">State</label>
                  <select
                    value={userState}
                    onChange={(e) => setUserState(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-primary"
                  >
                    {["Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Uttar Pradesh", "West Bengal", "Other"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">District</label>
                  <Input
                    type="text"
                    placeholder="Enter your district"
                    value={userDistrict}
                    onChange={(e) => setUserDistrict(e.target.value)}
                    className="h-11 rounded-xl border-border bg-background"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Scheme & Department Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <Building className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Step 2: Welfare Scheme & Government Department</h3>
              </div>

              {loadingSchemes ? (
                <div className="py-6 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {error && (
                    <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-sm flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div className="flex-1 text-muted-foreground">
                        <span className="font-bold text-foreground block">Unable to load schemes database</span>
                        {error} Please make sure the backend service is running. You can still manually enter scheme details by choosing the <strong>Custom Scheme</strong> option below.
                      </div>
                    </div>
                  )}
                  {/* Select Scheme */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Scheme from Database</label>
                    <select
                      value={selectedSchemeId}
                      onChange={(e) => handleSchemeChange(e.target.value)}
                      className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      {schemes.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                      ))}
                      <option value="custom">-- Custom / Other Scheme --</option>
                    </select>
                  </div>

                  {/* Dynamic Inputs if custom selected */}
                  {selectedSchemeId === "custom" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
                      {/* Custom Scheme Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scheme Name</label>
                        <Input
                          type="text"
                          placeholder="Enter scheme name"
                          value={schemeName}
                          onChange={(e) => setSchemeName(e.target.value)}
                          className="h-11 rounded-xl border-border bg-background"
                          required
                        />
                      </div>

                      {/* Custom Department Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Government Department</label>
                        <Input
                          type="text"
                          placeholder="Enter department name"
                          value={departmentName}
                          onChange={(e) => setDepartmentName(e.target.value)}
                          className="h-11 rounded-xl border-border bg-background"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Auto-filled details representation if database scheme chosen */}
                  {selectedSchemeId !== "custom" && (
                    <div className="p-4 rounded-xl border border-border/60 bg-muted/30 text-sm space-y-1.5">
                      <div className="flex justify-between">
                        <span className="font-bold text-muted-foreground">Scheme Name:</span>
                        <span className="font-semibold text-foreground">{schemeName}</span>
                      </div>
                      <div className="flex justify-between border-t border-border/40 pt-1.5 mt-1.5">
                        <span className="font-bold text-muted-foreground">Department:</span>
                        <span className="font-semibold text-foreground text-right">{departmentName}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Grievance Issues & Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <FilePenLine className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Step 3: Grievance & Complaint Details</h3>
              </div>

              {/* Issue Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nature of Grievance</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  {issueTypes.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>

              {/* Complaint Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descriptive Details of Grievance</label>
                <Textarea
                  placeholder="Provide detailed context regarding your complaint. (e.g. 'I registered on the PM-Kisan portal on February 12, 2026. My application was verified by local officers, but no benefit installments have been credited to my bank account...')"
                  value={complaintDetails}
                  onChange={(e) => setComplaintDetails(e.target.value)}
                  className="min-h-[140px] rounded-xl border-border bg-background text-sm leading-relaxed"
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 4: Generated Monospace Sheet Preview */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Step 4: Formal Letter Preview</h3>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-lg gap-1.5">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    Copy Text
                  </Button>
                  <Button size="sm" onClick={handlePrint} className="rounded-lg gap-1.5">
                    <Printer className="h-4 w-4" />
                    Print Letter
                  </Button>
                </div>
              </div>

              {/* Paper Sheet Preview container */}
              <div className="w-full overflow-x-auto p-1 bg-muted/30 border border-border/60 rounded-2xl">
                <div 
                  id="printable-letter" 
                  className="mx-auto my-4 w-full max-w-[650px] bg-white text-black p-8 sm:p-12 shadow-md rounded-lg font-serif text-sm sm:text-base border border-neutral-300 leading-relaxed whitespace-pre-wrap select-text"
                >
                  {generatedLetter}
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Stepper Buttons Controls */}
      <div className="flex items-center justify-between">
        {currentStep > 1 && currentStep < 4 ? (
          <Button variant="outline" onClick={handleBack} className="rounded-xl px-5 h-11 font-semibold">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
        ) : (
          <div /> /* placeholder to push Next to right */
        )}

        {currentStep < 3 && (
          <Button onClick={handleNext} className="rounded-xl px-6 h-11 font-semibold">
            Next
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}

        {currentStep === 3 && (
          <Button onClick={handleGenerateLetter} disabled={loadingLetter} className="rounded-xl px-6 h-11 font-semibold">
            {loadingLetter ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin mr-1.5" />
                Compiling letter draft...
              </>
            ) : (
              <>
                Generate Draft Letter
                <FileText className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        )}

        {currentStep === 4 && (
          <Button onClick={resetWizard} className="rounded-xl px-6 h-11 font-semibold">
            Draft Another Complaint
          </Button>
        )}
      </div>
    </div>
  );
}
