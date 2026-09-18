"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n/use-i18n";

const outcomeSchema = z.object({
  outcome: z.enum(["none_yet", "interview", "offer", "rejection", "not_sent"]),
  companyName: z.string().max(120).optional(),
  jobTitle: z.string().max(120).optional(),
  aiHelpfulRating: z.number().int().min(1).max(5).optional(),
  feedbackText: z.string().max(500).optional(),
});

type OutcomeFormData = z.infer<typeof outcomeSchema>;

interface OutcomeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvId?: string;
  coverLetterId?: string;
  onSubmit: (data: OutcomeFormData) => Promise<void>;
}

/**
 * Modal to collect user feedback on CV outcomes (got interview? offer? rejection?)
 * Closes the feedback loop: AI learns which CVs are effective
 *
 * Shown: After user downloads a CV (triggered in CV export flow)
 * Purpose: Track if our AI improvements actually help users get hired
 */
export function OutcomeReportModal({
  isOpen,
  onClose,
  cvId,
  coverLetterId,
  onSubmit,
}: OutcomeReportModalProps) {
  const t = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OutcomeFormData>({
    outcome: "none_yet",
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Failed to submit outcome:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("en", "outcome-title") || "How's your CV performing?"}
          </DialogTitle>
          <DialogDescription>
            {t("en", "outcome-description") ||
              "Help us improve by letting us know what happened with this CV. It takes 30 seconds."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Outcome selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t("en", "outcome-question") || "What's the best thing that happened?"}
            </Label>
            <RadioGroup value={formData.outcome} onValueChange={(val) =>
              setFormData({ ...formData, outcome: val as OutcomeFormData["outcome"] })
            }>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none_yet" id="none_yet" />
                <Label htmlFor="none_yet" className="font-normal cursor-pointer">
                  {t("en", "outcome-none") || "Nothing yet, I haven't sent it"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="not_sent" id="not_sent" />
                <Label htmlFor="not_sent" className="font-normal cursor-pointer">
                  {t("en", "outcome-not-sent") || "I'm still editing it"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="interview" id="interview" />
                <Label htmlFor="interview" className="font-normal cursor-pointer">
                  🎯 {t("en", "outcome-interview") || "Got an interview!"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="offer" id="offer" />
                <Label htmlFor="offer" className="font-normal cursor-pointer">
                  🎉 {t("en", "outcome-offer") || "Got a job offer!"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rejection" id="rejection" />
                <Label htmlFor="rejection" className="font-normal cursor-pointer">
                  {t("en", "outcome-rejection") || "Got rejection(s)"}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Optional context */}
          <div className="space-y-2">
            <Label htmlFor="company">{t("en", "company-optional") || "Company (optional)"}</Label>
            <input
              id="company"
              type="text"
              placeholder="Acme Corp"
              className="w-full px-3 py-2 border rounded-md text-sm"
              value={formData.companyName || ""}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          </div>

          {/* Helpful rating */}
          <div className="space-y-2">
            <Label>{t("en", "helpful-rating") || "How helpful was this CV?"}</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFormData({ ...formData, aiHelpfulRating: star })}
                  className={`text-2xl transition-transform hover:scale-110 ${
                    formData.aiHelpfulRating === star ? "scale-110" : "opacity-40"
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">{t("en", "feedback-optional") || "Any feedback? (optional)"}</Label>
            <Textarea
              id="feedback"
              placeholder="E.g., 'This CV got me 3 interviews in 2 weeks!'"
              className="text-sm"
              rows={3}
              value={formData.feedbackText || ""}
              onChange={(e) => setFormData({ ...formData, feedbackText: e.target.value })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t("en", "skip") || "Skip"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "Sending..." : t("en", "submit") || "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
