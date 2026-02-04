"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Car, Users, TrendingUp, Building2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  {
    icon: Building2,
    value: "New",
    label: "Product currently launching",
  },
  {
    icon: Car,
    value: "50K+",
    label: "Vehicles managed",
  },
  {
    icon: Users,
    value: "2K+",
    label: "Active users",
  },
  {
    icon: TrendingUp,
    value: "98%",
    label: "Customer satisfaction",
  },
];

export function StatsSection() {
  const container = useRef(null);

  useGSAP(
    () => {
      const items = gsap.utils.toArray(".stat-item");
      gsap.fromTo(
        items,
        { y: 30, opacity: 0 },
        {
          scrollTrigger: {
            trigger: container.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
        }
      );
    },
    { scope: container }
  );

  return (
    <section
      ref={container}
      className="py-20 md:py-24 bg-muted/30 relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.06]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="stat-item rounded-2xl border border-border/60 bg-background/80 backdrop-blur-sm px-6 py-8 text-center shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md dark:bg-background/60"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-figures tabular-nums">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
