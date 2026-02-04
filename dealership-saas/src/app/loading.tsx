import { CarLoader } from "@/components/ui/car-loader";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <CarLoader label="Loading…" size="lg" />
    </div>
  );
}
