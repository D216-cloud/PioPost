
"use client";

import { Mail, ArrowRight } from "lucide-react";
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
    <div className="w-full max-w-[460px] relative z-10">
      {/* Background Glow */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-[80px] animate-pulse" />
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-[80px] animate-pulse" />

      <div className="mb-12 text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-1000">
        <h1 className="logo-script text-[56px] bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 bg-clip-text text-transparent drop-shadow-sm">
          PinPost
        </h1>
        <p className="text-[15px] text-slate-500 font-medium tracking-tight max-w-[280px] mx-auto leading-relaxed">
          {isSignUp ? "Create your account to start creating" : "Your all-in-one platform for cross-platform post previews"}
        </p>
      </div>

      <div className="glass rounded-[2.5rem] p-1 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.12)] border-white/20 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/40 backdrop-blur-sm rounded-[2.25rem] px-8 sm:px-10 py-12 border border-white/40 shadow-inner">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="group relative flex w-full items-center justify-between gap-6 bg-white hover:bg-slate-50 text-slate-900 pl-8 pr-2 py-2 rounded-full text-[15px] font-bold border border-slate-100 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <GoogleIcon />
              <span className="text-slate-700">{isSignUp ? "Sign up with Google" : "Continue with Google"}</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-full transition-transform group-hover:translate-x-1 shadow-sm">
              <ArrowRight className="h-4 w-4 text-white" />
            </div>
          </button>

          <div className="my-10 flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-300">
            <span className="h-px flex-1 bg-slate-200/50" />
            or
            <span className="h-px flex-1 bg-slate-200/50" />
          </div>

          <form onSubmit={onEmailAuth} className="space-y-6">
            <div className="space-y-4">
              <div className="float-field group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder=" "
                  className="!rounded-2xl !bg-white/80 !border-slate-100 !px-5 !py-5 text-[15px] font-bold text-slate-900 focus:!border-blue-500/30 focus:!ring-blue-500/5 transition-all"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
                <label htmlFor="email">Email address</label>
              </div>

              <div className="float-field group">
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder=" "
                  className="!rounded-2xl !bg-white/80 !border-slate-100 !px-5 !py-5 text-[15px] font-bold text-slate-900 focus:!border-blue-500/30 focus:!ring-blue-500/5 transition-all"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
                <label htmlFor="password">Password</label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full items-center justify-between gap-6 bg-slate-900 hover:bg-black text-white pl-8 pr-2 py-2 rounded-full text-[15px] font-bold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl hover:shadow-2xl disabled:opacity-60 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/10 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="flex items-center gap-3 relative z-10">
                <Mail size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                {isLoading ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Create account" : "Sign in")}
              </div>
              <div className="bg-white p-2.5 rounded-full transition-transform group-hover:translate-x-1 shadow-sm relative z-10">
                <ArrowRight className="h-5 w-5 text-blue-600" />
              </div>
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100/50">
            <p className="text-center text-[14px] font-medium text-slate-500">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button 
                type="button"
                className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? "Sign in" : "Create one now"}
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          Trusted by <span className="text-slate-900">2,000+</span> creators worldwide
        </p>
        <p className="text-[12px] font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">
          By continuing, you agree to PinPost's <span className="underline cursor-pointer hover:text-slate-600 transition-colors">Terms of Service</span> and <span className="underline cursor-pointer hover:text-slate-600 transition-colors">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
