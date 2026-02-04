"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Img = { id?: string; url: string };

export function VehicleImageCarousel(props: {
  images?: Img[] | null;
  alt: string;
  className?: string;
  fit?: "contain" | "cover";
  enableGallery?: boolean;
}) {
  const images = useMemo(
    () => (props.images ?? []).filter((i) => !!i?.url),
    [props.images]
  );
  const [idx, setIdx] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const hasImages = images.length > 0;
  const activeUrl = hasImages
    ? images[Math.min(idx, images.length - 1)]?.url
    : "/vehicle-placeholder.svg";

  const canPrev = hasImages && images.length > 1;
  const canNext = hasImages && images.length > 1;

  const goPrev = () => setIdx((p) => (p - 1 + images.length) % images.length);
  const goNext = () => setIdx((p) => (p + 1) % images.length);
  const fit = props.fit ?? "contain";
  const enableGallery = props.enableGallery ?? true;

  const openGallery = () => {
    if (!enableGallery) return;
    setGalleryOpen(true);
  };

  return (
    <div className={cn("min-w-0 space-y-3", props.className)}>
      <div className="relative w-full max-w-full h-[280px] sm:h-[360px] md:h-[420px] lg:h-[520px] overflow-hidden rounded-lg border bg-muted">
        <button
          type="button"
          className="absolute inset-0 z-0 cursor-zoom-in"
          onClick={openGallery}
          aria-label="Open gallery"
        />
        <Image
          src={activeUrl}
          alt={props.alt}
          fill
          className={cn(
            fit === "cover" ? "object-cover" : "object-contain",
            "bg-muted"
          )}
          sizes="(max-width: 1024px) 100vw, 900px"
          priority
        />

        {hasImages && images.length > 1 && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background z-10"
              onClick={goPrev}
              disabled={!canPrev}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background z-10"
              onClick={goNext}
              disabled={!canNext}
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-2 right-2 rounded-md bg-background/70 px-2 py-1 text-xs text-muted-foreground">
              {idx + 1}/{images.length}
            </div>
          </>
        )}

        {enableGallery && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 bg-background/80 hover:bg-background z-10 gap-2"
            onClick={openGallery}
          >
            <Expand className="h-4 w-4" />
            Gallery
          </Button>
        )}
      </div>

      {hasImages && images.length > 1 && (
        <div className="w-full min-w-0 -mx-1 px-1">
          <div
            className="flex gap-2 overflow-x-auto overflow-y-hidden pb-1 scroll-smooth snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: "touch" }}
            role="region"
            aria-label="Image thumbnails"
          >
            {images.map((img, i) => (
              <button
                key={img.id ?? `${img.url}-${i}`}
                type="button"
                onClick={() => setIdx(i)}
                className={cn(
                  "relative h-14 w-24 shrink-0 flex-shrink-0 overflow-hidden rounded-md border snap-start sm:h-16 sm:w-28",
                  i === idx
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/60"
                )}
                aria-label={`Select image ${i + 1}`}
                aria-pressed={i === idx}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen gallery */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-6xl p-3 sm:p-4">
          <DialogTitle className="sr-only">{props.alt} gallery</DialogTitle>
          <div className="space-y-3">
            <div className="relative w-full h-[70vh] sm:h-[80vh] overflow-hidden rounded-lg border bg-muted">
              <Image
                src={activeUrl}
                alt={props.alt}
                fill
                className="object-contain bg-muted"
                sizes="(max-width: 1024px) 100vw, 1200px"
              />

              {hasImages && images.length > 1 && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={goPrev}
                    disabled={!canPrev}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={goNext}
                    disabled={!canNext}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <div className="absolute bottom-3 right-3 rounded-md bg-background/70 px-2 py-1 text-xs text-muted-foreground">
                    {idx + 1}/{images.length}
                  </div>
                </>
              )}
            </div>

            {hasImages && images.length > 1 && (
              <div
                className="flex gap-2 overflow-x-auto overflow-y-hidden pb-1 scroll-smooth"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {images.map((img, i) => (
                  <button
                    key={`gallery-${img.id ?? `${img.url}-${i}`}`}
                    type="button"
                    onClick={() => setIdx(i)}
                    className={cn(
                      "relative h-16 w-28 shrink-0 flex-shrink-0 overflow-hidden rounded-md border snap-start",
                      i === idx
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/60"
                    )}
                    aria-label={`Select image ${i + 1}`}
                    aria-pressed={i === idx}
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
