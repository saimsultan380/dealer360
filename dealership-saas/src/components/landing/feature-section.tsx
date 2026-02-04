"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Car,
  Users,
  FileText,
  BarChart3,
  ShieldCheck,
  Wallet,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Car,
    title: "Smart Inventory",
    desc: "Track stock, costs, expenses, and automated document generation for every vehicle in your lot.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Users,
    title: "CRM & Leads",
    desc: "Capture leads, assign follow-ups, and never lose a potential sale with our integrated CRM.",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    icon: FileText,
    title: "Auto Documentation",
    desc: "Generate agreements, invoices, and transfer letters with a single click. No more paperwork.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Wallet,
    title: "Investor Tracking",
    desc: "Manage third-party investors, track their contributions, and calculate profit sharing automatically.",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "See your daily profit/loss, cash flow, and sales performance instantly on your dashboard.",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    desc: "Enterprise-grade security with role-based access control to keep your sensitive data safe.",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
  },
];

export function FeatureSection() {
  const container = useRef(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray(".feature-card");

      cards.forEach((card: any, i) => {
        gsap.fromTo(
          card,
          { y: 40, opacity: 0 },
          {
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            delay: (i % 3) * 0.1, // Stagger effect based on column
          }
        );
      });
    },
    { scope: container }
  );

  return (
    <section
      id="features"
      ref={container}
      className="py-24 bg-background relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.08]" />
      </div>
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 backdrop-blur-sm mb-6">
            <span className="text-xs font-medium tracking-wide text-primary">
              Features
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight text-foreground">
            Everything you need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              scale
            </span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Powerful features designed specifically for modern car dealerships
            to automate operations and increase profitability.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="feature-card group relative rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background p-[1px] transition-transform duration-300 hover:-translate-y-1.5"
            >
              <div className="h-full rounded-[1.4rem] border border-border/60 bg-card/90 px-5 py-6 md:px-6 md:py-7 shadow-[0_18px_40px_rgba(15,23,42,0.06)] group-hover:border-primary/40 group-hover:shadow-[0_24px_55px_rgba(15,23,42,0.12)] transition-all duration-300 dark:bg-background/80">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <span className="hidden text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80 md:inline-flex rounded-full border border-border px-2 py-0.5">
                    Core feature
                  </span>
                </div>
                <h3 className="mb-2 text-lg md:text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
