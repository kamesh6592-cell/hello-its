import type { ReactNode } from "react";
import Image from "next/image";

export default async function AuthLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fractal%20Glass%20-%204.jpg-m0AGFq8cSUKl8bpkwATMUJsUJokLwH.jpeg')",
        }}
      />

      {/* Subtle overlay for better contrast */}
      <div className="absolute inset-0 bg-black/20" />

      <div className="flex-1 flex items-center justify-center w-full">
        {children}
      </div>

      <footer className="relative z-10 mb-6">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-6 py-4">
          <div className="flex items-center justify-center gap-3">
            <Image
              src="/aj-logo.jpg"
              alt="AJ STUDIOZ"
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
            <div className="text-center">
              <p className="text-white/90 text-sm font-medium">
                TOMO
              </p>
              <p className="text-white/60 text-xs">
                Powered by AJ STUDIOZ
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
