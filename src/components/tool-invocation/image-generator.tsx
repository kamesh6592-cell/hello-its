"use client";

import { ToolUIPart } from "ai";
import equal from "lib/equal";
import { cn } from "lib/utils";
import { ImagesIcon, Download } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { TextShimmer } from "ui/text-shimmer";
import LetterGlitch from "ui/letter-glitch";

interface ImageGeneratorToolInvocationProps {
  part: ToolUIPart;
}

interface ImageGenerationResult {
  images: {
    url: string;
    mimeType?: string;
  }[];
  mode?: "create" | "edit" | "composite";
  model: string;
}

function PureImageGeneratorToolInvocation({
  part,
}: ImageGeneratorToolInvocationProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const isGenerating = useMemo(() => {
    return !part.state.startsWith("output");
  }, [part.state]);

  const result = useMemo(() => {
    if (!part.state.startsWith("output")) return null;
    return part.output as ImageGenerationResult;
  }, [part.state, part.output]);

  const images = useMemo(() => {
    return result?.images || [];
  }, [result]);

  const mode = useMemo(() => {
    return result?.mode || "create";
  }, [result]);

  const hasError = useMemo(() => {
    return (
      part.state === "output-error" ||
      (part.state === "output-available" && result?.images.length === 0)
    );
  }, [part.state, result]);

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  };

  const handleDownload = async () => {
    if (!images[0]?.url) return;

    try {
      const response = await fetch(images[0].url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  // Get mode-specific text
  const getModeText = (mode: string) => {
    switch (mode) {
      case "edit":
        return "Editing image...";
      case "composite":
        return "Compositing images...";
      default:
        return "Generating image...";
    }
  };

  const getModeHeader = (mode: string) => {
    switch (mode) {
      case "edit":
        return "Image edited";
      case "composite":
        return "Images composited";
      default:
        return "Image generated";
    }
  };

  // Simple loading state with clean design
  if (isGenerating) {
    return (
      <div className="flex flex-col gap-3 max-w-2xl">
        <div className="flex items-center gap-2 px-1">
          <ImagesIcon className="size-4 text-primary animate-pulse" />
          <TextShimmer className="text-sm font-medium">
            {getModeText(mode)}
          </TextShimmer>
        </div>
        <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
              <LetterGlitch />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-4">
            <p className="text-xs text-muted-foreground text-center font-medium">
              This may take up to 1 minute
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-w-2xl">
      <div className="flex items-center gap-2 px-1">
        {!hasError && <ImagesIcon className="size-4 text-primary" />}
        <span className="text-sm font-semibold">
          {hasError ? "Image generation failed" : getModeHeader(mode)}
        </span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {result?.model}
        </span>
      </div>

      <div className="w-full">
        {hasError ? (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-xl text-sm">
            {part.errorText ??
              (result?.images.length === 0
                ? "No images generated"
                : "Failed to generate image. Please try again.")}
          </div>
        ) : images.length > 0 ? (
          <div className="relative group rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-2xl bg-card">
            {/* Single image display */}
            <div
              className={cn(
                "relative overflow-hidden transition-all duration-700 ease-out",
                loadedImages.has(0)
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[0].url}
                loading="lazy"
                alt="Generated image"
                className={cn(
                  "w-full h-auto object-cover transition-all duration-700",
                  loadedImages.has(0) ? "blur-0" : "blur-lg",
                )}
                style={{
                  maxHeight: "512px",
                  animation: loadedImages.has(0)
                    ? "revealImage 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                    : "none",
                }}
                onLoad={() => handleImageLoad(0)}
              />
            </div>

            {/* Loading skeleton */}
            {!loadedImages.has(0) && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-muted/30 to-primary/10 animate-pulse" />
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6 gap-3">
              <a
                href={images[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:scale-105 transition-all shadow-xl"
              >
                View Full Size
              </a>
              <button
                onClick={handleDownload}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:scale-105 transition-all shadow-xl flex items-center gap-2"
              >
                <Download className="size-4" />
                Download
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 text-muted-foreground p-4 rounded-xl text-sm border border-border/20">
            No images to display
          </div>
        )}
      </div>

      {/* Keyframe animation */}
      <style jsx>{`
        @keyframes revealImage {
          0% {
            opacity: 0;
            transform: scale(0.98);
            filter: blur(12px);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
          }
        }
      `}</style>
    </div>
  );
}

export const ImageGeneratorToolInvocation = memo(
  PureImageGeneratorToolInvocation,
  (prev, next) => {
    return equal(prev.part, next.part);
  },
);
