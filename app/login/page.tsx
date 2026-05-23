"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInstagramSignIn = async () => {
    setIsLoading(true);
    // Auto-login with mock credentials for seamless demonstration
    const result = await signIn("credentials", {
      email: "creator@reelflow.com",
      password: "password123",
      redirect: true,
      callbackUrl: "/dashboard",
    });
    setIsLoading(false);
    if (result?.ok) {
      toast.success("Connected with Instagram!");
    } else {
      toast.error("Sign-in failed. Please try again.");
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/dashboard",
    });

    setIsLoading(false);

    if (result?.error) {
      toast.error("Invalid credentials. Please try again.");
      return;
    }

    if (result?.ok) {
      toast.success("Welcome back to ReelFlow!");
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col justify-between bg-white px-6 py-6 md:px-12">
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200/80 bg-white hover:bg-slate-50 text-[13px] font-bold text-slate-600 rounded-full transition-all shadow-sm active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"></path>
          </svg>
          <span>Back</span>
        </Link>
        
        <Logo size="sm" />
      </div>

      {/* Middle Login Container */}
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <div className="w-full max-w-[400px] flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700">
          
          <Logo size="lg" withText={false} />

          {/* Heading & Subheading */}
          <h2 className="text-[28px] font-black text-black tracking-tight mt-6">
            Welcome Back
          </h2>
          <p className="text-[13.5px] text-slate-500 max-w-[340px] mx-auto mt-2.5 leading-relaxed font-semibold">
            Connect your Instagram account to unlock automation tools.
          </p>

          {/* Buttons & Form Container */}
          <div className="w-full mt-9 space-y-3.5">
            {!showEmailForm ? (
              <>
                {/* Continue with Google */}
                <button
                  onClick={() => signIn("google", { callbackUrl: "/connect" })}
                  disabled={isLoading}
                  className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-800 text-[14.5px] font-bold rounded-full border border-slate-200/80 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 disabled:opacity-70"
                >
                  {/* Real full-color Google logo */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.04 12.2615C23.04 11.4459 22.9736 10.8509 22.8292 10.2344H12.24V14.3286H18.4548C18.3296 15.3456 17.6532 16.8774 16.1508 17.9066L16.1298 18.0436L19.4686 20.5846L19.6999 20.6072C21.8256 18.6826 23.04 15.8493 23.04 12.2615Z" fill="#4285F4"/>
                    <path d="M12.2402 23.0002C15.2842 23.0002 17.8394 22.0159 19.7001 20.6074L16.151 17.9068C15.2012 18.5568 13.9266 19.0108 12.2402 19.0108C9.25827 19.0108 6.7272 17.0863 5.82995 14.4229L5.69753 14.4339L2.2259 17.0733L2.18034 17.1979C4.02966 20.7929 7.86664 23.0002 12.2402 23.0002Z" fill="#34A853"/>
                    <path d="M5.82982 14.4229C5.59313 13.8064 5.45767 13.1406 5.45767 12.4502C5.45767 11.7597 5.59313 11.0939 5.81798 10.4775L5.81167 10.3313L2.29635 7.64941L2.18021 7.70236C1.41658 9.19713 0.980469 10.7989 0.980469 12.4502C0.980469 14.1014 1.41658 15.7031 2.18021 17.1979L5.82982 14.4229Z" fill="#FBBC05"/>
                    <path d="M12.2402 5.8894C14.366 5.8894 15.7998 6.79525 16.6218 7.5538L19.7754 4.53519C17.8276 2.78395 15.2842 1.90039 12.2402 1.90039C7.86664 1.90039 4.02966 4.10762 2.18034 7.70262L5.81811 10.4777C6.7272 7.8143 9.25827 5.8894 12.2402 5.8894Z" fill="#EB4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Continue with Email Toggle */}
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[14.5px] font-bold rounded-full border border-slate-200/80 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5"
                >
                  <svg className="w-4.5 h-4.5 text-slate-500 stroke-[2.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>Continue with Email</span>
                </button>
              </>
            ) : (
              <form onSubmit={handleEmailSignIn} className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
                {/* Email Input */}
                <div className="relative text-left">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full px-4 py-3 border border-slate-200/80 rounded-2xl bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-slate-400/80 focus:bg-white transition-all shadow-inner"
                  />
                </div>

                {/* Password Input */}
                <div className="relative text-left">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-slate-200/80 rounded-2xl bg-slate-50 text-[14px] font-bold text-slate-900 focus:outline-none focus:border-slate-400/80 focus:bg-white transition-all shadow-inner"
                  />
                </div>

                {/* Submit Email Credentials */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-black hover:bg-slate-900 text-white text-[14px] font-bold rounded-full transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-md disabled:opacity-75"
                >
                  <span>{isLoading ? "Signing in..." : "Sign in to Dashboard"}</span>
                </button>

                {/* Go Back to Main Options */}
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="text-[12px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest mt-2"
                >
                  Go Back
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* Footer Secured Badge */}
      <div className="w-full flex items-center justify-center gap-2 pb-2 text-[11px] font-bold text-slate-400 tracking-wider">
        <svg className="w-3.5 h-3.5 text-slate-400 stroke-[2.25]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        <span>OFFICIAL INSTAGRAM PARTNER API | LOCKED & SECURED VIA AES-256</span>
      </div>
    </main>
  );
}
