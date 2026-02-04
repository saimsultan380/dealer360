"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Menu,
  LayoutGrid,
  ListOrdered,
  CreditCard,
  MessageSquareQuote,
  Car,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navLinks = [
  { name: "Features", href: "#features", icon: LayoutGrid },
  { name: "How it works", href: "#how-it-works", icon: ListOrdered },
  { name: "Pricing", href: "#pricing", icon: CreditCard },
  { name: "Testimonials", href: "#testimonials", icon: MessageSquareQuote },
];

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
        scrolled
          ? "bg-background/80 backdrop-blur-md border-border py-2"
          : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Car className="h-4 w-4" aria-hidden="true" />
          </div>
          <span
            className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70"
            style={{ fontFamily: "var(--font-prata), Prata, serif" }}
          >
            Dealer 360
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-foreground hover:text-primary"
            >
              Log in
            </Button>
          </Link>
          <Link href="/login?view=sign_up">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 rounded-xl"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-[320px] sm:max-w-[360px] p-0 flex flex-col border-l border-border bg-background"
        >
          <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border px-5 pr-14 py-4">
            <SheetTitle asChild>
              <Link
                href="/"
                onClick={closeMobile}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Car className="h-4 w-4" aria-hidden="true" />
                </div>
                <span
                  className="text-lg font-bold text-foreground"
                  style={{ fontFamily: "var(--font-prata), Prata, serif" }}
                >
                  Dealer 360
                </span>
              </Link>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Menu
            </p>
            <ul className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      onClick={closeMobile}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors",
                        "text-foreground hover:bg-muted hover:text-primary"
                      )}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Appearance
              </p>
              <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-muted/50">
                <span className="text-sm font-medium text-foreground">
                  Theme
                </span>
                <ThemeToggle />
              </div>
            </div>
          </nav>

          <div className="border-t border-border p-4 space-y-3 bg-muted/20">
            <Link href="/login" onClick={closeMobile} className="block">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl"
                size="lg"
              >
                Log in
              </Button>
            </Link>
            <Link
              href="/login?view=sign_up"
              onClick={closeMobile}
              className="block"
            >
              <Button className="w-full h-12 rounded-xl" size="lg">
                Get Started
              </Button>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
