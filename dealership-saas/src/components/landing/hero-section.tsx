"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Car, Check } from "lucide-react";

export function HeroSection() {
  const container = useRef<HTMLElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const quickRotateX = useRef<((value: number) => void) | null>(null);
  const quickRotateY = useRef<((value: number) => void) | null>(null);

  useGSAP(
    () => {
      const reduceMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ??
        false;

      if (!reduceMotion) {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.fromTo(
          ".hero-badge",
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.1 }
        )
          .fromTo(
            ".hero-title",
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.85 },
            "-=0.2"
          )
          .fromTo(
            ".hero-desc",
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6 },
            "-=0.45"
          )
          .fromTo(
            ".hero-buttons",
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6 },
            "-=0.2"
          )
          .fromTo(
            ".hero-proof",
            { opacity: 0 },
            { opacity: 1, duration: 0.6 },
            "-=0.25"
          )
          .fromTo(
            ".hero-visual",
            { scale: 0.965, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.9 },
            "-=0.65"
          );

        gsap.to(".hero-float", {
          y: -10,
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: { each: 0.18, from: "random" },
        });

        gsap.to(".hero-glow", {
          opacity: 0.85,
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    },
    { scope: container }
  );

  const ensureTiltQuickSetters = () => {
    if (!tiltRef.current) return;
    if (quickRotateX.current && quickRotateY.current) return;

    gsap.set(tiltRef.current, { transformPerspective: 1000 });
    quickRotateX.current = gsap.quickTo(tiltRef.current, "rotateX", {
      duration: 0.8,
      ease: "power2.out",
    });
    quickRotateY.current = gsap.quickTo(tiltRef.current, "rotateY", {
      duration: 0.8,
      ease: "power2.out",
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!tiltRef.current) return;

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (reduceMotion) return;

    // Disable tilt on small screens (touch devices)
    if (window.matchMedia?.("(max-width: 1023px)")?.matches) return;

    ensureTiltQuickSetters();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    quickRotateY.current?.(x * 7);
    quickRotateX.current?.(-y * 7);
  };

  const handleMouseLeave = () => {
    if (!tiltRef.current) return;
    ensureTiltQuickSetters();
    quickRotateY.current?.(0);
    quickRotateX.current?.(0);
  };

  return (
    <section
      ref={container}
      className="relative min-h-screen flex items-center pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden bg-background text-foreground"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.12]" />
        <div className="hero-glow absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] opacity-60" />
        <div className="absolute -bottom-28 -left-24 h-[520px] w-[520px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -top-40 -right-28 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="max-w-3xl z-10 relative">
          <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 backdrop-blur-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium tracking-wide text-primary">
              Built for modern car dealers
            </span>
          </div>

          <h1 className="hero-title tracking-tight mb-5">
            Run your dealership on{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              one system
            </span>
            .
          </h1>

          <p className="hero-desc text-base sm:text-lg md:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
            Inventory, CRM, sales, deals, documents, investors, and analytics
            built for speed and designed for Pakistani dealerships.
          </p>

          <div className="hero-buttons flex flex-wrap items-center gap-3">
            <Link href="/login?view=sign_up" className="inline-flex">
              <Button
                size="lg"
                className="h-12 rounded-xl px-6 sm:px-8 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features" className="inline-flex">
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-xl px-6 sm:px-8 text-base font-medium border-2 border-border hover:bg-muted hover:border-primary/30 transition-all"
              >
                View features
              </Button>
            </Link>
          </div>

          <div className="hero-proof mt-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>No credit card required</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Currently launching with select dealerships</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Setup in minutes</span>
            </div>
          </div>
        </div>

        <div className="hero-visual relative z-0 mt-8 lg:mt-0">
          <div
            ref={tiltRef}
            className="relative mx-auto max-w-[680px] rounded-3xl border border-border bg-card/40 p-3 shadow-2xl shadow-primary/10 backdrop-blur-sm will-change-transform dark:bg-white/5"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Frame header */}
            <div className="flex items-center justify-between px-2 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
              </div>
              <div className="text-xs text-muted-foreground">
                Dealer360 Dashboard
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2 py-0.5 text-primary border border-primary/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-border bg-background">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-blue-500/10" />
              <Image
                src="/hero-img.png"
                alt="Dealer360 dashboard preview"
                width={1400}
                height={900}
                priority
                className="block h-auto w-full"
              />
            </div>

            {/* Floating cards — desktop only so they don't cover the image on mobile */}
            <div className="hero-float absolute -bottom-6 left-4 sm:left-6 rounded-2xl border border-border bg-background/80 px-4 py-3 shadow-xl backdrop-blur-md dark:bg-background/40 hidden md:flex">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                  ₨
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue today</p>
                  <p className="text-base font-bold text-foreground">
                    PKR 2.4M
                  </p>
                </div>
              </div>
            </div>

            <div className="hero-float absolute top-10 -right-3 sm:top-14 sm:-right-6 rounded-2xl border border-border bg-background/80 px-4 py-3 shadow-xl backdrop-blur-md dark:bg-background/40 hidden md:flex">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                  +
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">New leads</p>
                  <p className="text-base font-bold text-foreground">
                    12 active
                  </p>
                </div>
              </div>
            </div>

            <div className="hero-float absolute -top-5 left-10 sm:left-14 rounded-2xl border border-border bg-background/80 px-4 py-3 shadow-xl backdrop-blur-md dark:bg-background/40 hidden md:flex">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-bold">
                  <Car className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Inventory</p>
                  <p className="text-base font-bold text-foreground">
                    148 vehicles
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile: compact stats row below image so nothing overlaps */}
            <div className="flex md:hidden mt-3 gap-2">
              <div className="flex-1 min-w-0 flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 dark:bg-background/40">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                  <Car className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">Inventory</p>
                  <p className="text-xs font-bold text-foreground truncate">
                    148
                  </p>
                </div>
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 dark:bg-background/40">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                  +
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">Leads</p>
                  <p className="text-xs font-bold text-foreground truncate">
                    12
                  </p>
                </div>
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 dark:bg-background/40">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  ₨
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">Revenue</p>
                  <p className="text-xs font-bold text-foreground truncate">
                    2.4M
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
