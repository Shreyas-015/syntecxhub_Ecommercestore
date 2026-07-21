import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFields } from "../validation/authSchema";
import { useAuth } from "../context/AuthContext";
import { PageTransition } from "../components/common/PageTransition";
import { Button } from "../components/common/Button";
import { useToast } from "../context/ToastContext";
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Chrome, 
  Github, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Determine redirect URL from location state
  const from = (location.state as any)?.from?.pathname || "/profile";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFields) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login(data);
      // Wait for AuthProvider toast and session update to process, then redirect
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    showToast(`${provider} Authentication is set up for Phase 3 OAuth configuration.`, "info");
  };

  const handleForgotPassword = () => {
    showToast("Password recovery has been sent to your email inbox (Simulated).", "success");
  };

  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 py-16 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white border border-slate-100 p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-100/50">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
              <Sparkles className="w-3 h-3" />
              <span>Identity Verification</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-slate-400">
              Welcome back! Provide your credentials to log in.
            </p>
          </div>

          {/* Quick Demo Credentials Banner */}
          <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
              <HelpCircle className="w-4 h-4" />
              <span>Demo Sandbox Credentials</span>
            </div>
            <div className="text-[11px] text-blue-600 space-y-0.5">
              <p>Email: <strong className="font-mono">demo@syntexstore.com</strong></p>
              <p>Password: <strong className="font-mono">Demo@123</strong></p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-2xl flex items-start gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="e.g. jdoe@domain.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all ${
                    errors.email ? "border-rose-400 focus:border-rose-400" : "border-slate-200 focus:border-blue-500"
                  }`}
                  {...register("email")}
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-600 block">Account Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter secure password"
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all ${
                    errors.password ? "border-rose-400 focus:border-rose-400" : "border-slate-200 focus:border-blue-500"
                  }`}
                  {...register("password")}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2 rounded-lg"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500/20"
                {...register("rememberMe")}
              />
              <label htmlFor="rememberMe" className="ml-2 text-xs text-slate-500 select-none cursor-pointer">
                Remember my secure session
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 mt-2 font-semibold"
              isLoading={isSubmitting}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Secure Login
            </Button>

          </form>

          {/* Social Auth Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-bold font-mono">
              <span className="bg-white px-3 text-slate-400">Or Continue With</span>
            </div>
          </div>

          {/* Social Auth Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSocialLogin("Google")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-100 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all"
            >
              <Chrome className="w-4 h-4 text-rose-500" />
              <span>Google</span>
            </button>
            
            <button
              onClick={() => handleSocialLogin("GitHub")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-100 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all"
            >
              <Github className="w-4 h-4 text-slate-800" />
              <span>GitHub</span>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-400">
              Don't have a secure store account yet?{" "}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Create one now
              </Link>
            </p>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};
