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
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-6 py-3">
          <p className="text-sm text-white/80 text-center">
            Powered by <span className="text-white/90">❤️</span>{" "}
            <span className="text-white/90 font-medium">TOMO Academy</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
