"use client";

import React, { useCallback, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail, AlertCircle, CheckCircle2, Copy } from "lucide-react";
import { t, type Lang } from "@/lib/i18n/translations";

interface SendToRecruiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvId: string;
  coverLetterId?: string;
  sw: boolean;
  onSubmit?: (data: {
    recipientEmail: string;
    recipientName: string;
    customMessage: string;
    jobTitle: string;
    company: string;
    jobDescription: string;
    includeCV: boolean;
    includeCoverLetter: boolean;
    includeTrackingPixel: boolean;
    saveToProfile: boolean;
  }) => Promise<void>;
}

export function SendToRecruiterModal({
  isOpen,
  onClose,
  cvId,
  coverLetterId,
  sw,
  onSubmit,
}: SendToRecruiterModalProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [includeCV, setIncludeCV] = useState(true);
  const [includeCoverLetter, setIncludeCoverLetter] = useState(false);
  const [includeTrackingPixel, setIncludeTrackingPixel] = useState(true);
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailChange = (email: string) => {
    setRecipientEmail(email);
    if (email && !validateEmail(email)) {
      setEmailValidationError(sw ? "Barua pepe si sahihi" : "Invalid email address");
    } else {
      setEmailValidationError(null);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // Validate required fields
    if (!recipientEmail) {
      setError(sw ? "Ingiza barua pepe ya mkipokezi" : "Please enter recipient email");
      return;
    }

    if (!validateEmail(recipientEmail)) {
      setError(sw ? "Barua pepe si sahihi" : "Invalid email address");
      return;
    }

    if (!includeCV && !includeCoverLetter) {
      setError(
        sw
          ? "Chagua angalau CV au barua ya wasilisho"
          : "Select at least CV or cover letter"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.({
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim(),
        customMessage: customMessage.trim(),
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        jobDescription: jobDescription.trim(),
        includeCV,
        includeCoverLetter,
        includeTrackingPixel,
        saveToProfile,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : (sw ? "Kosa fulani limetokea" : "An error occurred")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-ember" />
            {sw ? "Tuma kwa Mtu wa Ajira" : "Send to Recruiter"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Recipient Email */}
          <div className="space-y-2">
            <Label htmlFor="recipientEmail" className="text-sm font-semibold">
              {sw ? "Barua pepe ya mkipokezi *" : "Recipient Email *"}
            </Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder={sw ? "mjumbe@kampuni.com" : "recruiter@company.com"}
              value={recipientEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={emailValidationError ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {emailValidationError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {emailValidationError}
              </p>
            )}
          </div>

          {/* Recipient Name */}
          <div className="space-y-2">
            <Label htmlFor="recipientName" className="text-sm font-semibold">
              {sw ? "Jina la mkipokezi (kwa aختiyariy)" : "Recipient Name (optional)"}
            </Label>
            <Input
              id="recipientName"
              placeholder={sw ? "Mpr. Ahmed" : "E.g., Ahmed"}
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Job Context */}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wide">
              {sw ? "Muktadha wa Kazi (kwa aختiyariy)" : "Job Context (optional)"}
            </p>
            <div className="space-y-3">
              <Input
                placeholder={sw ? "Mpr. Software Engineer" : "E.g., Software Engineer"}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isSubmitting}
              />
              <Input
                placeholder={sw ? "Mpr. Safaricom" : "E.g., Safaricom"}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={isSubmitting}
              />
              <Textarea
                placeholder={
                  sw
                    ? "Andika kazi inahitaji (JD) kwa muktadha..."
                    : "Paste job description for context..."
                }
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value.slice(0, 1000))}
                disabled={isSubmitting}
                className="min-h-24 resize-none text-xs"
              />
              <p className="text-xs text-text-muted text-right">
                {jobDescription.length}/1000
              </p>
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="customMessage" className="text-sm font-semibold">
              {sw ? "Ujumbe wa zaidi (kwa aختiyariy)" : "Custom Message (optional)"}
            </Label>
            <Textarea
              id="customMessage"
              placeholder={
                sw
                  ? "Andika ujumbe wako wa mtu binafsi hapa..."
                  : "Hi [Name], I'm applying for the [Role] position..."
              }
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value.slice(0, 500))}
              disabled={isSubmitting}
              className="min-h-20 resize-none"
            />
            <p className="text-xs text-text-muted text-right">
              {customMessage.length}/500
            </p>
          </div>

          {/* Document Selection */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
              {sw ? "Hati za Kuandika *" : "Documents to Send *"}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="includeCV"
                  checked={includeCV}
                  onCheckedChange={setIncludeCV}
                  disabled={isSubmitting}
                />
                <Label htmlFor="includeCV" className="text-sm cursor-pointer">
                  {sw ? "CV" : "CV"}
                </Label>
              </div>
              {coverLetterId && (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="includeCoverLetter"
                    checked={includeCoverLetter}
                    onCheckedChange={setIncludeCoverLetter}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="includeCoverLetter" className="text-sm cursor-pointer">
                    {sw ? "Barua ya Wasilisho" : "Cover Letter"}
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
              {sw ? "Chaguo Jingine" : "Advanced Options"}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="includeTrackingPixel"
                  checked={includeTrackingPixel}
                  onCheckedChange={setIncludeTrackingPixel}
                  disabled={isSubmitting}
                />
                <Label htmlFor="includeTrackingPixel" className="text-sm cursor-pointer">
                  <span className="flex items-center gap-1">
                    {sw ? "Fuatilia kama barua pepe ilifunguka" : "Track email opens"}
                    <span className="text-xs text-text-muted">(kwa maelezo)</span>
                  </span>
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="saveToProfile"
                  checked={saveToProfile}
                  onCheckedChange={setSaveToProfile}
                  disabled={isSubmitting}
                />
                <Label htmlFor="saveToProfile" className="text-sm cursor-pointer">
                  {sw
                    ? "Hifadhi mkipokezi katika wajarida wangu"
                    : "Save recruiter to my contacts"}
                </Label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            {sw ? "Batilisha" : "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {sw ? "Inatuma..." : "Sending..."}
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                {sw ? "Tuma Sasa" : "Send Now"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
