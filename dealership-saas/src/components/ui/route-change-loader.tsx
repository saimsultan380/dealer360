"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { CarLoader } from "@/components/ui/car-loader";

function isModifiedClick(event: MouseEvent) {
  return (
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.button !== 0
  );
}

function getClosestAnchor(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  return target.closest("a[href]") as HTMLAnchorElement | null;
}

function isSameOriginInternalLink(anchor: HTMLAnchorElement) {
  try {
    const url = new URL(anchor.href, window.location.href);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function RouteChangeLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";

  const [active, setActive] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const showWithDelay = () => {
      clearTimer();
      // Avoid flashes on fast navigations.
      timerRef.current = window.setTimeout(() => setActive(true), 180);
    };

    const onClickCapture = (event: MouseEvent) => {
      if (isModifiedClick(event)) return;
      const anchor = getClosestAnchor(event.target);
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (!isSameOriginInternalLink(anchor)) return;

      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#")) return;

      const url = new URL(anchor.href, window.location.href);
      // If you're clicking the same URL, don't show loader.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      )
        return;

      showWithDelay();
    };

    const onBeforeUnload = () => setActive(true);

    window.addEventListener("click", onClickCapture, true);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearTimer();
      window.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  React.useEffect(() => {
    // URL changed => navigation finished
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setActive(false);
  }, [pathname, search]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <CarLoader label="Loading…" size="lg" />
    </div>
  );
}
