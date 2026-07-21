import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFields } from "../validation/authSchema";
import { useAuth } from "../context/AuthContext";
import { PageTransition } from "../components/common/PageTransition";
import { Button } from "../components/common/Button";
import { useToast } from "../context/ToastContext";
import { 
  Sparkles, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";

export const Register: React.FC = () => {
  const { register: signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  // Watch password field to compute strength indicator
  const passwordValue = useWatch({
    control,
    name: "password",
    defaultValue: "",
  });

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: "None", color: "bg-slate-200", textColor: "text-slate-400" };
    
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 25, text: "Weak", color: "bg-red-500", textColor: "text-red-500" };
      case 2:
        return { score: 50, text: "Fair", color: "bg-amber-500", textColor: "text-amber-500" };
      case 3:
        return { score: 75, text: "Good", color: "bg-blue-500", textColor: "text-blue-500" };
      case 4:
        return { score: 100, text: "Strong", color: "bg-green-500", textColor: "text-green-500" };
      default:
        return { score: 0, text: "None", color: "bg-slate-200", textColor: "text-slate-400" };
    }
  };

  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: RegisterFields) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await signup(data);
      navigate("/profile", { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || "An account with this email may already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="bg-slate-50/50 flex-1 py-12 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg space-y-8 bg-white border border-slate-100 p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-100/50">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
              <Sparkles className="w-3 h-3" />
              <span>Conscious Enrollment</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
              Create Your Secure Account
            </h2>
            <p className="text-xs text-slate-400">
              Join Syntex Store to access exclusive coordinates and order logs.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-2xl flex items-start gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all ${
                    errors.name ? "border-rose-400 focus:border-rose-400" : "border-slate-200 focus:border-blue-500"
                  }`}
                  {...register("name")}
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
              {errors.name && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Email & Phone grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Email Address */}
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

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Phone Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="e.g. 1234567890"
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all ${
                      errors.phone ? "border-rose-400 focus:border-rose-400" : "border-slate-200 focus:border-blue-500"
                    }`}
                    {...register("phone")}
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                </div>
                {errors.phone && (
                  <p className="text-[11px] text-rose-500 font-medium">{errors.phone.message}</p>
                )}
              </div>

            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Choose a strong password"
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

              {/* Password Strength Indicator */}
              {passwordValue && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-slate-400">Security Strength:</span>
                    <span className={strength.textColor}>{strength.text}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${strength.color} transition-all duration-300`} 
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px] text-slate-400 font-medium list-disc pl-3">
                    <li className={passwordValue.length >= 8 ? "text-green-600 font-semibold" : ""}>Min 8 characters</li>
                    <li className={/[A-Z]/.test(passwordValue) ? "text-green-600 font-semibold" : ""}>At least 1 uppercase</li>
                    <li className={/[a-z]/.test(passwordValue) ? "text-green-600 font-semibold" : ""}>At least 1 lowercase</li>
                    <li className={/[0-9]/.test(passwordValue) ? "text-green-600 font-semibold" : ""}>At least 1 number</li>
                  </ul>
                </div>
              )}
              
              {errors.password && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter secure password"
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all ${
                    errors.confirmPassword ? "border-rose-400 focus:border-rose-400" : "border-slate-200 focus:border-blue-500"
                  }`}
                  {...register("confirmPassword")}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2 rounded-lg"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Accept Terms */}
            <div className="space-y-1">
              <div className="flex items-start">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500/20 mt-0.5"
                  {...register("acceptTerms")}
                />
                <label htmlFor="acceptTerms" className="ml-2 text-xs text-slate-500 select-none cursor-pointer leading-normal">
                  I accept the{" "}
                  <button type="button" onClick={() => showToast("Terms of service agreement retrieved (Mock).", "info")} className="text-blue-600 font-bold hover:underline">
                    Terms & Conditions
                  </button>{" "}
                  and consent to secure cryptographic session management.
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-[11px] text-rose-500 font-medium pl-6.5">{errors.acceptTerms.message}</p>
              )}
            </div>

            {/* Create Account Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 mt-2 font-semibold text-sm"
              isLoading={isSubmitting}
              icon={<UserPlus className="w-4.5 h-4.5" />}
            >
              Create My Store Account
            </Button>

          </form>

          {/* Already have account */}
          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Already have an active store account?{" "}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Sign in securely
              </Link>
            </p>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};
