"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { useLang } from "@/lib/i18n/context";

const inputClass =
  "w-full px-4 py-3 border border-border-input rounded-input text-sm bg-sand-2 text-espresso placeholder:text-text-muted/60 focus:outline-none focus:shadow-focus-ember focus:border-ember transition";

export function ContactForm() {
  const sw = useLang() === "sw";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (data.success) {
        setStatus("success");
      } else {
        setErrorMsg(data.error ?? (sw ? "Kuna hitilafu imetokea. Tafadhali jaribu tena." : "Something went wrong. Please try again."));
        setStatus("error");
      }
    } catch {
      setErrorMsg(sw ? "Hitilafu ya mtandao. Tafadhali angalia muunganisho wako." : "Network error. Please check your connection.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-cream border border-border rounded-card-lg p-8 flex flex-col items-center justify-center text-center min-h-[320px]">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="font-display font-extrabold tracking-tight text-espresso text-xl mb-2">
          {sw ? "Ujumbe umetumwa!" : "Message sent!"}
        </h3>
        <p className="text-text-body text-sm leading-relaxed">
          {sw
            ? "Asante kwa kuwasiliana nasi. Tumekutumia barua pepe ya uthibitisho na tutakujibu ndani ya saa 24."
            : "Thanks for reaching out. We’ve sent you a confirmation email and will reply within 24 hours."}
        </p>
        <button
          onClick={() => {
            setStatus("idle");
            setName("");
            setEmail("");
            setMessage("");
          }}
          className="mt-6 text-sm text-ember-hover hover:text-ember font-semibold transition"
        >
          {sw ? "Tuma ujumbe mwingine" : "Send another message"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-cream border border-border rounded-card-lg p-8">
      <h2 className="font-display font-extrabold tracking-tight text-espresso text-2xl mb-6">
        {sw ? "Tuma ujumbe" : "Send a message"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-semibold text-espresso mb-1.5">{sw ? "Jina" : "Name"}</label>
          <input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            required
            placeholder={sw ? "Jina lako" : "Your name"}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-semibold text-espresso mb-1.5">{sw ? "Barua pepe" : "Email"}</label>
          <input
            id="contact-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-sm font-semibold text-espresso mb-1.5">{sw ? "Ujumbe" : "Message"}</label>
          <AutoTextarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
            placeholder={sw ? "Tunawezaje kukusaidia?" : "How can we help?"}
            className={`${inputClass} min-h-[120px]`}
          />
        </div>
        {status === "error" && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-input px-4 py-2.5">
            {errorMsg}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={status === "loading"}
          className="w-full"
        >
          {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === "loading" ? (sw ? "Inatuma..." : "Sending...") : (sw ? "Tuma ujumbe" : "Send message")}
        </Button>
      </form>
    </div>
  );
}
