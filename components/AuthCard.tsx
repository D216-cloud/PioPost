
"use client";

import { Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M23.04 12.2615C23.04 11.4459 22.9736 10.8509 22.8292 10.2344H12.24V14.3286H18.4548C18.3296 15.3456 17.6532 16.8774 16.1508 17.9066L16.1298 18.0436L19.4686 20.5846L19.6999 20.6072C21.8256 18.6826 23.04 15.8493 23.04 12.2615Z" fill="#4285F4" />
      <path d="M12.2402 23.0002C15.2842 23.0002 17.8394 22.0159 19.7001 20.6074L16.151 17.9068C15.2012 18.5568 13.9266 19.0108 12.2402 19.0108C9.25827 19.0108 6.7272 17.0863 5.82995 14.4229L5.69753 14.4339L2.2259 17.0733L2.18034 17.1979C4.02966 20.7929 7.86664 23.0002 12.2402 23.0002Z" fill="#34A853" />
      <path d="M5.82982 14.4229C5.59313 13.8064 5.45767 13.1406 5.45767 12.4502C5.45767 11.7597 5.59313 11.0939 5.81798 10.4775L5.81167 10.3313L2.29635 7.64941L2.18021 7.70236C1.41658 9.19713 0.980469 10.7989 0.980469 12.4502C0.980469 14.1014 1.41658 15.7031 2.18021 17.1979L5.82982 14.4229Z" fill="#FBBC05" />
      <path d="M12.2402 5.8894C14.366 5.8894 15.7998 6.79525 16.6218 7.5538L19.7754 4.53519C17.8276 2.78395 15.2842 1.90039 12.2402 1.90039C7.86664 1.90039 4.02966 4.10762 2.18034 7.70262L5.81811 10.4777C6.7272 7.8143 9.25827 5.8894 12.2402 5.8894Z" fill="#EB4335" />
    </svg>
  );
}

export function AuthCard() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      // In a real app, you'd call an API to create the user here.
      // For this demo, we'll just simulate a successful signup and then sign in.
      toast.success("Account created successfully!");
      setIsSignUp(false);
      setIsLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setIsLoading(false);

    if (result?.error) {
      toast.error("Invalid credentials. Please try again.");
      return;
    }

    toast.success("Welcome back to PinPost.");
    window.location.href = result?.url ?? "/dashboard";
  };

  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-8 text-center">
        <h1 className="logo-script text-[42px] text-slate-900 mb-1">PinPost</h1>
        <p className="text-[14px] text-slate-500 font-medium tracking-tight">
          {isSignUp ? "Create your account to start creating" : "Sign in to preview your posts across every platform"}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)] px-8 py-10">
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
        >
          <GoogleIcon /> {isSignUp ? "Sign up with Google" : "Continue with Google"}
        </button>

        <div className="my-8 flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-300">
          <span className="h-px flex-1 bg-slate-100" />
          or
          <span className="h-px flex-1 bg-slate-100" />
        </div>

        <form onSubmit={onEmailAuth} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-[12px] font-bold text-slate-700 mb-2">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0096d6]/20 transition-all"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[12px] font-bold text-slate-700 mb-2">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0096d6]/20 transition-all"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0096d6] px-4 py-4 text-[14px] font-bold text-white transition-all hover:bg-[#0085bd] disabled:opacity-60 shadow-lg shadow-[#0096d6]/20"
          >
            {isLoading ? (
              isSignUp ? "Creating account..." : "Signing in..."
            ) : (
              <>
                <Mail size={16} />
                {isSignUp ? "Create account" : "Sign in"}
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[13px] font-medium text-slate-500">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <span 
            className="font-bold text-[#0096d6] cursor-pointer hover:underline"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </span>
        </p>
      </div>

      <p className="mt-8 text-center text-[12px] font-medium text-slate-400 max-w-sm mx-auto">
        By signing in, you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
}
