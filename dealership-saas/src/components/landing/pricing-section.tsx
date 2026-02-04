"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const ANNUAL_DISCOUNT_PERCENT = 20;

const plans = [
  {
    name: "Starter",
    monthlyPrice: 5000,
    desc: "Perfect for small showrooms starting their digital journey.",
    features: [
      "Up to 50 Vehicles",
      "Basic CRM",
      "1 User Account",
      "Standard Support",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    monthlyPrice: 10000,
    desc: "For growing dealerships that need advanced tools and insights.",
    features: [
      "Unlimited Vehicles",
      "Advanced CRM & Leads",
      "5 User Accounts",
      "Investor Tracking",
      "Priority Support",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    desc: "Tailored solutions for large networks and multi-branch dealers.",
    features: [
      "Multi-branch Management",
      "Custom Reports",
      "Unlimited Users",
      "Dedicated Account Manager",
      "API Access",
    ],
    highlight: false,
  },
];

function formatPrice(n: number) {
  return n.toLocaleString("en-PK");
}

export function PricingSection() {
  const container = useRef(null);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  useGSAP(
    () => {
      gsap.fromTo(
        ".pricing-card",
        { y: 50, opacity: 0 },
        {
          scrollTrigger: {
            trigger: "#pricing",
            start: "top 72%",
            toggleActions: "play none none reverse",
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
        }
      );
    },
    { scope: container }
  );

  return (
    <section
      id="pricing"
      ref={container}
      className="py-24 bg-background text-foreground relative overflow-hidden"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.08]" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 backdrop-blur-sm mb-6">
            <span className="text-xs font-medium tracking-wide text-primary">
              Pricing
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight text-foreground">
            Simple, transparent{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              pricing
            </span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Choose the plan that fits your dealership. Switch between monthly
            and annual billing—save 20% with annual.
          </p>

          {/* Billing toggle - SaaS style */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                billing === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all flex items-center gap-2",
                billing === "annual"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Annual
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                Save {ANNUAL_DISCOUNT_PERCENT}%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => {
            const isAnnual = billing === "annual";
            const price =
              plan.monthlyPrice === null
                ? null
                : isAnnual
                  ? Math.round(
                      (plan.monthlyPrice * (100 - ANNUAL_DISCOUNT_PERCENT)) /
                        100
                    )
                  : plan.monthlyPrice;
            const yearlyTotal = price === null ? null : price * 12;
            const displayPrice = price === null ? "Custom" : formatPrice(price);
            const displayYearly =
              yearlyTotal === null ? null : formatPrice(yearlyTotal);
            const sublabel =
              price === null
                ? null
                : isAnnual
                  ? "per month, billed annually"
                  : "per month";

            return (
              <div
                key={i}
                className={cn(
                  "pricing-card relative flex flex-col rounded-2xl border p-6 md:p-8 transition-all duration-300",
                  plan.highlight
                    ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 dark:bg-primary/10"
                    : "border-border bg-card/40 backdrop-blur-sm dark:bg-white/5 hover:border-primary/20"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-md">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2 text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground min-h-[2.5rem]">
                    {plan.desc}
                  </p>
                </div>

                <div className="mb-8">
                  <span className="text-4xl font-bold tracking-tight text-foreground font-figures tabular-nums">
                    {displayPrice === "Custom"
                      ? "Custom"
                      : `PKR ${displayPrice}`}
                  </span>
                  {sublabel && (
                    <span className="ml-1 text-sm text-muted-foreground">
                      {sublabel.startsWith("per month,")
                        ? "per month"
                        : sublabel}
                    </span>
                  )}
                  {price !== null && displayYearly && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      PKR {displayYearly}/year
                    </p>
                  )}
                  {isAnnual && price !== null && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Billed annually
                    </p>
                  )}
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                      <div className="h-5 w-5 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/login?view=sign_up" className="w-full">
                  <Button
                    className={cn(
                      "w-full",
                      plan.highlight
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-secondary hover:bg-secondary/80 text-foreground"
                    )}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {displayPrice === "Custom"
                      ? "Contact sales"
                      : "Start free trial"}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          All plans include a free trial. No credit card required. Cancel
          anytime.
        </p>
      </div>
    </section>
  );
}
