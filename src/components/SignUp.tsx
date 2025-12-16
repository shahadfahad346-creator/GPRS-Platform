import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { GraduationCap, UserCheck, Mail, Lock, Eye, EyeOff, User, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../../frontend/lib/auth-context";
import { toast } from "sonner";
import { InteractiveBackground } from "./Backgrounds";

type UserType = "student" | "supervisor";

interface SignUpProps {
  onNavigateToLogin: () => void;
  onNavigateToHome: () => void;
}

export function SignUp({ onNavigateToLogin, onNavigateToHome }: SignUpProps) {
  const { signup } = useAuth();
  const [userType, setUserType] = useState<UserType>("student");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Validate Full Name
  const validateFullName = (name: string): boolean => {
    if (!name || name.trim().length < 2) {
      setErrors(prev => ({ ...prev, fullName: "Full name must be at least 2 characters" }));
      return false;
    }
    setErrors(prev => ({ ...prev, fullName: "" }));
    return true;
  };

  // Validate Email
  const validateEmail = (email: string): boolean => {
    if (!email) {
      setErrors(prev => ({ ...prev, email: "Email is required" }));
      return false;
    }

    if (userType === "student") {
      const studentEmailRegex = /^\d+@stu\.bu\.edu\.sa$/;
      if (!studentEmailRegex.test(email)) {
        setErrors(prev => ({ 
          ...prev, 
          email: "Student email must start with student ID and end with @stu.bu.edu.sa (e.g., 123456789@stu.bu.edu.sa)" 
        }));
        return false;
      }
    } else {
      const supervisorEmailRegex = /^[a-zA-Z0-9._%+-]+@bu\.edu\.sa$/;
      if (!supervisorEmailRegex.test(email)) {
        setErrors(prev => ({ 
          ...prev, 
          email: "Supervisor email must end with @bu.edu.sa (e.g., professor@bu.edu.sa)" 
        }));
        return false;
      }
      if (email.match(/^\d+@stu\.bu\.edu\.sa$/)) {
        setErrors(prev => ({ 
          ...prev, 
          email: "Supervisor email should not start with numbers" 
        }));
        return false;
      }
    }

    setErrors(prev => ({ ...prev, email: "" }));
    return true;
  };

  // Validate Password
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: "Password is required" }));
      return false;
    }

    if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: "Password must be at least 8 characters" }));
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      setErrors(prev => ({ ...prev, password: "Password must contain at least one uppercase letter (A-Z)" }));
      return false;
    }

    if (!/[a-z]/.test(password)) {
      setErrors(prev => ({ ...prev, password: "Password must contain at least one lowercase letter (a-z)" }));
      return false;
    }

    if (!/[0-9]/.test(password)) {
      setErrors(prev => ({ ...prev, password: "Password must contain at least one number (0-9)" }));
      return false;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setErrors(prev => ({ ...prev, password: "Password must contain at least one special character (!@#$%^&*...)" }));
      return false;
    }

    setErrors(prev => ({ ...prev, password: "" }));
    return true;
  };

  // Validate Confirm Password
  const validateConfirmPassword = (confirmPassword: string, password: string): boolean => {
    if (!confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Please confirm your password" }));
      return false;
    }

    if (confirmPassword !== password) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      return false;
    }

    setErrors(prev => ({ ...prev, confirmPassword: "" }));
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const isNameValid = validateFullName(formData.fullName);
    const isEmailValid = validateEmail(formData.email);
    const isPasswordValid = validatePassword(formData.password);
    const isConfirmPasswordValid = validateConfirmPassword(formData.confirmPassword, formData.password);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      await signup(formData.email, formData.password, formData.fullName, userType);
      toast.success("Account created successfully! Welcome to GPRS");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <InteractiveBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onNavigateToHome}
          className="mb-4 hover:bg-emerald-900/5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-900/10 to-slate-700/10 text-emerald-900 px-4 py-2 rounded-full mb-4 border border-emerald-800/20"
          >
            <GraduationCap className="w-4 h-4" />
            <span className="text-sm">Create Account</span>
          </motion.div>

          <h1 className="text-3xl md:text-4xl mb-3 bg-gradient-to-r from-emerald-900 via-slate-800 to-teal-900 bg-clip-text text-transparent">
            Join GPRS
          </h1>
          <p className="text-slate-600">
            Sign up to access the Graduation Project Recommendation System
          </p>
        </div>

        <Card className="border-2 border-emerald-900/10 shadow-xl p-6 bg-white/95 backdrop-blur-sm">
          {/* User Type Toggle */}
          <div className="flex gap-3 mb-6">
            <motion.button
              type="button"
              onClick={() => {
                setUserType("student");
                setFormData({ ...formData, email: "" });
                setErrors({ fullName: "", email: "", password: "", confirmPassword: "" });
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                userType === "student"
                  ? "bg-gradient-to-r from-emerald-800 to-emerald-900 text-white border-emerald-800 shadow-lg"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-700 hover:bg-slate-100"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="text-sm">Student</span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => {
                setUserType("supervisor");
                setFormData({ ...formData, email: "" });
                setErrors({ fullName: "", email: "", password: "", confirmPassword: "" });
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                userType === "supervisor"
                  ? "bg-gradient-to-r from-slate-800 to-slate-900 text-white border-slate-800 shadow-lg"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-700 hover:bg-slate-100"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserCheck className="w-5 h-5" />
              <span className="text-sm">Supervisor</span>
            </motion.button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-700">
                Full Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    setErrors({ ...errors, fullName: "" });
                  }}
                  onBlur={() => validateFullName(formData.fullName)}
                  className={`pl-10 pr-4 py-6 bg-slate-50 border-slate-200 focus:border-emerald-800 focus:ring-emerald-800 ${
                    errors.fullName ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  required
                />
              </div>
              {errors.fullName && (
                <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errors.fullName}</span>
                </div>
              )}
            </div>

            {/* University Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                University Email *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder={
                    userType === "student" 
                      ? "123456789@stu.bu.edu.sa" 
                      : "professor@bu.edu.sa"
                  }
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrors({ ...errors, email: "" });
                  }}
                  onBlur={() => validateEmail(formData.email)}
                  className={`pl-10 pr-4 py-6 bg-slate-50 border-slate-200 focus:border-emerald-800 focus:ring-emerald-800 ${
                    errors.email ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  required
                />
              </div>
              {errors.email && (
                <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errors.email}</span>
                </div>
              )}
              <p className="text-xs text-slate-500">
                {userType === "student" 
                  ? "✓ Must start with student ID and end with @stu.bu.edu.sa"
                  : "✓ Must end with @bu.edu.sa"}
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">
                Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setErrors({ ...errors, password: "" });
                  }}
                  onBlur={() => validatePassword(formData.password)}
                  className={`pl-10 pr-12 py-6 bg-slate-50 border-slate-200 focus:border-emerald-800 focus:ring-emerald-800 ${
                    errors.password ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
{showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}                </button>
              </div>
              {errors.password && (
                <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errors.password}</span>
                </div>
              )}
              <div className="text-xs text-slate-500 space-y-1">
                <p>Password requirements:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li className={formData.password.length >= 8 ? "text-green-600" : ""}>At least 8 characters</li>
                  <li className={/[A-Z]/.test(formData.password) ? "text-green-600" : ""}>One uppercase letter (A-Z)</li>
                  <li className={/[a-z]/.test(formData.password) ? "text-green-600" : ""}>One lowercase letter (a-z)</li>
                  <li className={/[0-9]/.test(formData.password) ? "text-green-600" : ""}>One number (0-9)</li>
                  <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? "text-green-600" : ""}>One special character (!@#$%...)</li>
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700">
                Confirm Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    setErrors({ ...errors, confirmPassword: "" });
                  }}
                  onBlur={() => validateConfirmPassword(formData.confirmPassword, formData.password)}
                  className={`pl-10 pr-12 py-6 bg-slate-50 border-slate-200 focus:border-emerald-800 focus:ring-emerald-800 ${
                    errors.confirmPassword ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className={`w-full py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 ${
                  userType === "student"
                    ? "bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-slate-800"
                    : "bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-emerald-800"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  `Sign up as ${userType === "student" ? "Student" : "Supervisor"}`
                )}
              </Button>
            </div>

            {/* Login Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-sm text-slate-600 hover:text-emerald-800 transition-colors"
              >
                Already have an account?{" "}
                <span className="text-emerald-800 underline">Login</span>
              </button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
