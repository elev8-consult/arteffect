"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import type { ContactContent } from "@/types/content";

type SubmissionState = { message?: string; status: "error" | "idle" | "submitting" | "success" };

export function ContactForm({ topics }: Pick<ContactContent, "topics">) {
  const [state, setState] = useState<SubmissionState>({ status: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState({ status: "submitting" });
    const fields = new FormData(form);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          consentToReply: fields.get("consentToReply") === "on",
          email: fields.get("email"),
          message: fields.get("message"),
          name: fields.get("name"),
          orderNumber: fields.get("orderNumber"),
          phone: fields.get("phone"),
          topic: fields.get("topic"),
          website: fields.get("website")
        })
      });
      const body = await response.json() as { data?: { message?: string }; error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message || "Your message could not be sent.");
      form.reset();
      setState({ message: body.data?.message ?? "Thank you. Your message has been received.", status: "success" });
    } catch (error) {
      setState({ message: error instanceof Error ? error.message : "Your message could not be sent.", status: "error" });
    }
  }

  if (state.status === "success") {
    return <div role="status" aria-live="polite" className="flex min-h-[32rem] flex-col items-start justify-center border border-[var(--border)] bg-[var(--ae-white)] p-8 sm:p-12"><CheckCircle2 className="size-8 text-[var(--ae-gilt)]" aria-hidden="true" /><p className="ae-display mt-6 text-5xl leading-none text-[var(--ae-forest)]">Message received.</p><p className="mt-5 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">{state.message}</p><Button type="button" variant="link" className="mt-7" onClick={() => setState({ status: "idle" })}>Send another message <ArrowRight className="size-4" /></Button></div>;
  }

  return <form onSubmit={submit} className="border border-[var(--border)] bg-[var(--ae-white)] p-6 sm:p-10">
    <div className="grid gap-6 sm:grid-cols-2">
      <Field label="Name" name="name" autoComplete="name" required minLength={2} maxLength={120} />
      <Field label="Email" name="email" type="email" autoComplete="email" required maxLength={254} />
      <label className="grid gap-2 text-sm font-semibold text-[var(--ae-forest)]">Topic<select name="topic" required defaultValue="" className="focus-ring h-12 rounded-sm border border-[var(--border)] bg-transparent px-3 font-normal"><option value="" disabled>Choose a topic</option>{topics.map((topic) => <option key={topic.value} value={topic.value}>{topic.label}</option>)}</select></label>
      <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" maxLength={40} />
      <Field label="Order number (optional)" name="orderNumber" placeholder="AE-YYYYMMDD-XXXXXXXXXX" maxLength={40} className="sm:col-span-2" />
      <label className="grid gap-2 text-sm font-semibold text-[var(--ae-forest)] sm:col-span-2">Message<textarea name="message" required minLength={10} maxLength={5000} rows={7} className="focus-ring resize-y rounded-sm border border-[var(--border)] bg-transparent p-3 font-normal leading-6" /></label>
      <label className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="flex items-start gap-3 text-sm leading-6 text-[var(--muted-foreground)] sm:col-span-2"><input name="consentToReply" type="checkbox" required className="focus-ring mt-1 size-4 shrink-0 accent-[var(--ae-forest)]" /><span>I agree that ArtEffect may use these details to reply to my enquiry.</span></label>
    </div>
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4"><Button type="submit" size="lg" loading={state.status === "submitting"} loadingLabel="Sending message">Send message <ArrowRight className="size-4" aria-hidden="true" /></Button><p aria-live="polite" role={state.status === "error" ? "alert" : "status"} className="max-w-sm text-sm text-[var(--destructive)]">{state.status === "error" ? state.message : null}</p></div>
  </form>;
}

function Field({ className = "", label, name, ...props }: { className?: string; label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className={`grid gap-2 text-sm font-semibold text-[var(--ae-forest)] ${className}`}>{label}<input name={name} className="focus-ring h-12 rounded-sm border border-[var(--border)] bg-transparent px-3 font-normal" {...props} /></label>;
}
