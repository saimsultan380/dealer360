"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function CTASection() {
  const container = useRef(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".cta-content",
        { y: 30, opacity: 0 },
        {
          scrollTrigger: {
            trigger: container.current,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
        }
      );
    },
    { scope: container }
  );

  return (
    <section
      ref={container}
      className="py-24 bg-background relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.08]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-primary/15 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="cta-content relative rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 md:p-12 lg:p-16 text-center shadow-xl shadow-primary/10 dark:shadow-black/25 dark:border-border/80 backdrop-blur-sm">
          <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.06] dark:opacity-[0.08]" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              Ready to run your dealership on one system?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Join 500+ dealerships. No credit card required. Start your free
              trial in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login?view=sign_up">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 text-base shadow-lg shadow-primary/25 dark:shadow-primary/20 dark:shadow-lg"
                >
                  Start free trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-8 border-2 border-border hover:bg-muted hover:border-primary/30 dark:hover:bg-muted/50"
                >
                  View features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
