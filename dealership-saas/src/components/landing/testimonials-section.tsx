"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    quote:
      "DealerOS replaced our spreadsheets and sticky notes. We close more deals and our investors get clear reports. Game changer.",
    name: "Ahmed Khan",
    role: "Owner, Premium Motors Lahore",
  },
  {
    quote:
      "Inventory, CRM, and documents in one place—exactly what we needed. Setup took less than an hour. Highly recommend.",
    name: "Sara Malik",
    role: "Operations Manager, Auto Hub Karachi",
  },
  {
    quote:
      "Real-time profit and cash flow visibility helped us scale to a second showroom. Support team is responsive and helpful.",
    name: "Imran Hassan",
    role: "Director, Metro Cars Islamabad",
  },
  {
    quote:
      "We tried three other systems before DealerOS. This one actually fits how Pakistani dealerships work. Worth every rupee.",
    name: "Farhan Ali",
    role: "Partner, City Motors Faisalabad",
  },
  {
    quote:
      "Investor tracking and automated docs saved us countless hours. Our accountant loves the reports. Setup was painless.",
    name: "Zainab Ahmed",
    role: "CFO, Nationwide Auto Lahore",
  },
];

export function TestimonialsSection() {
  const container = useRef<HTMLElement | null>(null);
  const [emblaApi, setEmblaApi] = useState<CarouselApi | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback((api: CarouselApi) => {
    if (!api) return;
    setSelectedIndex(api.selectedScrollSnap());
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    const handler = () => onSelect(emblaApi);
    emblaApi.on("select", handler);
    emblaApi.on("reInit", handler);
    return () => {
      emblaApi.off("select", handler);
      emblaApi.off("reInit", handler);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const totalSlides = emblaApi?.scrollSnapList()?.length ?? testimonials.length;

  useGSAP(
    () => {
      gsap.fromTo(
        ".testimonials-header",
        { y: 30, opacity: 0 },
        {
          scrollTrigger: {
            trigger: container.current,
            start: "top 78%",
            toggleActions: "play none none reverse",
          },
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
        }
      );
    },
    { scope: container }
  );

  return (
    <section
      id="testimonials"
      ref={container}
      className="py-24 bg-muted/30 relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.06]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="testimonials-header text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 backdrop-blur-sm mb-6">
            <span className="text-xs font-medium tracking-wide text-primary">
              Testimonials
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight text-foreground">
            Trusted by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              dealers like you
            </span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            See what dealership owners and managers say about running their
            business on DealerOS.
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto px-2 sm:px-0">
          {/* Arrow navigation - desktop: sides */}
          <div className="absolute left-0 top-1/2 z-10 -translate-y-1/2 hidden md:flex -translate-x-2 lg:translate-x-0 lg:-left-4 xl:-left-12">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full border-border bg-background/90 shadow-md backdrop-blur-sm hover:bg-muted disabled:opacity-40"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2 hidden md:flex translate-x-2 lg:translate-x-0 lg:-right-4 xl:-right-12">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full border-border bg-background/90 shadow-md backdrop-blur-sm hover:bg-muted disabled:opacity-40"
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <Carousel
            setApi={setEmblaApi}
            opts={{
              align: "start",
              loop: true,
              skipSnaps: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 md:-ml-6">
              {testimonials.map((t, i) => (
                <CarouselItem
                  key={i}
                  className={cn(
                    "pl-4 md:pl-6",
                    "basis-full sm:basis-full md:basis-1/2 lg:basis-1/3"
                  )}
                >
                  <div className="h-full rounded-2xl border border-border bg-background/80 backdrop-blur-sm p-6 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md dark:bg-background/60">
                    <Quote className="h-10 w-10 text-primary/30 mb-4" />
                    <p className="text-foreground leading-relaxed mb-6 min-h-[4.5rem]">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div>
                      <p className="font-semibold text-foreground">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Mobile: arrows + dots in one row */}
          <div className="flex md:hidden items-center justify-center gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full shrink-0"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-all duration-300",
                    i === selectedIndex
                      ? "bg-primary scale-125 w-8"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full shrink-0"
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Desktop: dot pagination only (arrows are on sides) */}
          <div className="hidden md:flex justify-center gap-2 mt-8">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all duration-300",
                  i === selectedIndex
                    ? "bg-primary scale-125 w-8"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
