export default async function AuthLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Gradient */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      />

      {/* Subtle overlay for better contrast */}
      <div className="absolute inset-0 bg-black/10" />

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
