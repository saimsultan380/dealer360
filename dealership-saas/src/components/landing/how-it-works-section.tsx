"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { UserPlus, Car, Handshake, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: UserPlus,
    title: "Sign up in minutes",
    desc: "Create your account, add your team, and connect your dealership. No lengthy onboarding.",
  },
  {
    icon: Car,
    title: "Add your inventory",
    desc: "Import or add vehicles with costs and docs. Everything in one place with smart filters.",
  },
  {
    icon: Handshake,
    title: "Close deals & track payments",
    desc: "Manage leads, generate agreements, and track investor payouts—all from one dashboard.",
  },
  {
    icon: BarChart3,
    title: "Grow with real-time insights",
    desc: "See profit, cash flow, and performance at a glance. Make decisions backed by data.",
  },
];

export function HowItWorksSection() {
  const container = useRef(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray(".how-step");
      gsap.fromTo(
        items,
        { y: 40, opacity: 0 },
        {
          scrollTrigger: {
            trigger: container.current,
            start: "top 78%",
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
      id="how-it-works"
      ref={container}
      className="py-24 bg-background relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.08]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 backdrop-blur-sm mb-6">
            <span className="text-xs font-medium tracking-wide text-primary">
              Simple process
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight text-foreground">
            Get started in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              four steps
            </span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            From signup to your first deal—no complex setup. Built for busy
            dealers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="how-step group relative rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg dark:bg-white/5"
            >
              <span className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-muted-foreground">
                {i + 1}
              </span>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/login?view=sign_up">
            <Button size="lg" className="shadow-lg shadow-primary/20">
              Start free trial
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
