"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export function ProductImageCarousel({
  images,
  alt,
  className,
  priority,
  sizes,
}: ProductImageCarouselProps) {
  const normalized = useMemo(() => {
    const list = images.filter(Boolean);
    return Array.from(new Set(list));
  }, [images]);

  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [normalized.join("|")]);

  if (normalized.length === 0) {
    return null;
  }

  const total = normalized.length;
  const hasControls = total > 1;

  const goPrev = () => setIndex((i) => (i - 1 + total) % total);
  const goNext = () => setIndex((i) => (i + 1) % total);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX;
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 40) {
      if (dx > 0) {
        goPrev();
      } else {
        goNext();
      }
    }
    startX.current = null;
  };

  return (
    <div
      className={cn("relative h-full w-full touch-pan-y", className)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="h-full w-full overflow-hidden">
        <div
          className="flex h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {normalized.map((src, i) => (
            <div key={`${src}-${i}`} className="relative h-full w-full shrink-0">
              <Image
                src={src}
                alt={`${alt} ${i + 1}`}
                fill
                priority={priority && i === 0}
                sizes={sizes}
                draggable={false}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {hasControls && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Imagem anterior"
            className="absolute top-1/2 left-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Próxima imagem"
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <ChevronRight className="size-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {normalized.map((_, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                aria-label={`Ir para imagem ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index
                    ? "w-5 bg-white"
                    : "w-2.5 bg-white/60 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
