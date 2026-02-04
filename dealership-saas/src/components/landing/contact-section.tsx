"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit form");
      }

      form.reset();
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      id="contact"
      className="py-20 md:py-24 bg-muted/40 border-y border-border/60"
    >
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
              Talk to our team
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
              Share your details. We&apos;ll contact you shortly.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl">
              Let us know a few basics about your{" "}
              <span className="font-medium">dealership or showroom</span> and
              how to reach you. Our team will get in touch to walk you through
              Dealer 360 and answer any questions.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                No commitment, just a quick intro call.
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                We typically respond within 1 business day.
              </li>
            </ul>
          </div>

          <div
            className={cn(
              "rounded-2xl border border-border bg-card/80 dark:bg-background/80 shadow-sm",
              "backdrop-blur supports-[backdrop-filter]:bg-card/70"
            )}
          >
            <form className="p-5 md:p-6 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label
                  htmlFor="contact-name"
                  className="text-sm font-medium text-foreground"
                >
                  Name<span className="text-destructive">*</span>
                </label>
                <Input
                  id="contact-name"
                  name="name"
                  placeholder="Your full name"
                  required
                  autoComplete="name"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="contact-business"
                  className="text-sm font-medium text-foreground"
                >
                  Business / Showroom name
                </label>
                <Input
                  id="contact-business"
                  name="business"
                  placeholder="e.g. Premium Motors Lahore"
                  autoComplete="organization"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="contact-phone-email"
                  className="text-sm font-medium text-foreground"
                >
                  Phone number or email
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  id="contact-phone-email"
                  name="phoneOrEmail"
                  placeholder="WhatsApp number or email address"
                  required
                  autoComplete="tel"
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll only use this to contact you about Dealer 360.
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="contact-notes"
                  className="text-sm font-medium text-foreground"
                >
                  Anything else we should know?{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <Textarea
                  id="contact-notes"
                  name="notes"
                  placeholder="Tell us about your current process, number of vehicles, or what you want help with."
                  rows={3}
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full h-10 md:h-11"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Submit details"}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  By submitting, you agree to be contacted by the Dealer 360
                  team about this enquiry.
                </p>
                {error && (
                  <p className="text-xs text-destructive text-center">
                    {error}
                  </p>
                )}
                {submitted && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center">
                    Thank you — we&apos;ve received your details and will be in
                    touch shortly.
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
