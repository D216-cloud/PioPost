import { AuthCard } from "@/components/AuthCard";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10 bg-white overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pattern-grid opacity-[0.4] pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#0ea5e9]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#2563eb]/5 blur-[120px] pointer-events-none" />
      
      <AuthCard />
    </main>
  );
}
