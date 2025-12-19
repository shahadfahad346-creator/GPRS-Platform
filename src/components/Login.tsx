import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { GraduationCap, UserCheck, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../../Frontend/lib/auth-context";
import { toast } from "sonner";
import { InteractiveBackground } from "./Backgrounds";

type UserType = "student" | "supervisor";

interface LoginProps {
  onNavigateToSignUp: () => void;
  onNavigateToHome: () => void;
}

const REMEMBER_EMAIL_KEY = "gprs_remembered_email";
const REMEMBER_USER_TYPE_KEY = "gprs_remembered_user_type";
const REMEMBER_ME_KEY = "gprs_remember_me";

export function Login({ onNavigateToSignUp, onNavigateToHome }: LoginProps) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [userType, setUserType] = useState<UserType>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // States للـ Forgot Password
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");

  // ⭐ States جديدة للـ OTP
const [showOTPScreen, setShowOTPScreen] = useState(false);
const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
const [otpLoading, setOtpLoading] = useState(false);
const [otpError, setOtpError] = useState("");

// ⭐ States جديدة للـ Timer
const [otpTimer, setOtpTimer] = useState(300); // 5 minutes = 600 seconds
const [canResendOTP, setCanResendOTP] = useState(false);

// ⭐ States جديدة لكلمة المرور الجديدة
const [showNewPasswordScreen, setShowNewPasswordScreen] = useState(false);
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [newPasswordLoading, setNewPasswordLoading] = useState(false);
const [passwordError, setPasswordError] = useState("");

  // Load saved email on mount
  useEffect(() => {
    try {
      const savedRememberMe = localStorage.getItem(REMEMBER_ME_KEY);
      if (savedRememberMe === "true") {
        const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
        const savedUserType = localStorage.getItem(
          REMEMBER_USER_TYPE_KEY
        ) as UserType | null;

        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }

        if (
          savedUserType &&
          (savedUserType === "student" || savedUserType === "supervisor")
        ) {
          setUserType(savedUserType);
        }
      }
    } catch (error) {
      console.error("Error loading saved email:", error);
    }
  }, []);
   
  // Timer للـ OTP
useEffect(() => {
  let interval: NodeJS.Timeout;
  
  if (showOTPScreen && otpTimer > 0) {
    interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          setCanResendOTP(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }
  
  return () => {
    if (interval) clearInterval(interval);
  };
}, [showOTPScreen, otpTimer]);

  // Validate Email
  const validateEmail = (email: string): boolean => {
    setEmailError("");

    if (!email) {
      setEmailError("Email is required");
      return false;
    }

    if (userType === "student") {
      const studentEmailRegex = /^\d+@stu\.bu\.edu\.sa$/;
      if (!studentEmailRegex.test(email)) {
        setEmailError(
          "Student email must start with student ID and end with @stu.bu.edu.sa"
        );
        return false;
      }
    } else {
      const supervisorEmailRegex = /^[a-zA-Z0-9._%+-]+@bu\.edu\.sa$/;
      if (!supervisorEmailRegex.test(email)) {
        setEmailError("Supervisor email must end with @bu.edu.sa");
        return false;
      }
      if (email.match(/^\d+@stu\.bu\.edu\.sa$/)) {
        setEmailError("Supervisor email must not start with numbers");
        return false;
      }
    }

    return true;
  };


  // Validate Forgot Password Email
  const validateForgotPasswordEmail = (email: string): boolean => {
    setForgotPasswordError("");

    if (!email) {
      setForgotPasswordError("Email is required");
      return false;
    }

    if (userType === "student") {
      const studentEmailRegex = /^\d+@stu\.bu\.edu\.sa$/;
      if (!studentEmailRegex.test(email)) {
        setForgotPasswordError(
          "Student email must start with student ID and end with @stu.bu.edu.sa"
        );
        return false;
      }
    } else {
      const supervisorEmailRegex = /^[a-zA-Z0-9._%+-]+@bu\.edu\.sa$/;
      if (!supervisorEmailRegex.test(email)) {
        setForgotPasswordError("Supervisor email must end with @bu.edu.sa");
        return false;
      }
      if (email.match(/^\d+@stu\.bu\.edu\.sa$/)) {
        setForgotPasswordError("Supervisor email must not start with numbers");
        return false;
      }
    }

    return true;
  };
  
  // Format timer to MM:SS
const formatTimer = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const validatePassword = (password: string): boolean => {
  setPasswordError("");
  
  if (!password) {
    setPasswordError("Password is required");
    return false;
  }
  
  if (password.length < 8) {
    setPasswordError("Password must be at least 8 characters");
    return false;
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    setPasswordError("Password must contain at least one lowercase letter");
    return false;
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    setPasswordError("Password must contain at least one uppercase letter");
    return false;
  }
  
  if (!/(?=.*\d)/.test(password)) {
    setPasswordError("Password must contain at least one number");
    return false;
  }
  
  return true;
};

// Handle Reset Password
const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validatePassword(newPassword)) {
    return;
  }
  
  if (newPassword !== confirmPassword) {
    setPasswordError("Passwords do not match");
    return;
  }
  
  setNewPasswordLoading(true);
  
  try {
    const response = await fetch("http://127.0.0.1:5000/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: forgotPasswordEmail,
        newPassword: newPassword,
        userType: userType,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to reset password");
    }
    
    toast.success("Password reset successfully! You can now login.");
    
    setShowNewPasswordScreen(false);
    setNewPassword("");
    setConfirmPassword("");
    setForgotPasswordEmail("");
    setOtpValues(["", "", "", "", "", ""]);
    
  } catch (error: any) {
    console.error("Reset password error:", error);
    toast.error("Failed to reset password. Please try again.");
  } finally {
    setNewPasswordLoading(false);
  }
};

// Handle OTP Verification
const handleVerifyOTP = async () => {
  const otpCode = otpValues.join("");
  
  if (otpCode.length !== 6) {
    setOtpError("Please enter all 6 digits");
    return;
  }

  setOtpLoading(true);
  setOtpError("");

  try {
    const response = await fetch("http://127.0.0.1:5000/api/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: forgotPasswordEmail,
        otp: otpCode,
        userType: userType,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Invalid OTP");
    }

    toast.success("Code verified successfully!");
    setShowOTPScreen(false);
    setShowNewPasswordScreen(true);
    
  } catch (error: any) {
    console.error("OTP verification error:", error);
    setOtpError("Failed to verify code. Please try again.");
  } finally {
    setOtpLoading(false);
  }
};

  // Handle Forgot Password Submit
const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForgotPasswordEmail(forgotPasswordEmail)) return;

  setForgotPasswordLoading(true);
  try {
    const response = await fetch("http://127.0.0.1:5000/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: forgotPasswordEmail,
        userType: userType,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send OTP");
    }

    toast.success("Verification code sent! Check your email.");
    
    setShowForgotPassword(false);
    setShowOTPScreen(true);       // نفتح شاشة OTP
    
    setOtpTimer(300); // 5 minutes
    setCanResendOTP(false);

  } catch (error: any) {
    console.error("Forgot password error:", error);
    toast.error("Failed to send verification code");
  } finally {
    setForgotPasswordLoading(false);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) return;
    if (!password) {
      toast.error("Password is required");
      return;
    }

    setLoading(true);
    try {
      await login(email, password, userType);

      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        localStorage.setItem(REMEMBER_USER_TYPE_KEY, userType);
        localStorage.setItem(REMEMBER_ME_KEY, "true");
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
        localStorage.removeItem(REMEMBER_USER_TYPE_KEY);
        localStorage.removeItem(REMEMBER_ME_KEY);
      }

      toast.success("Login successful! Welcome back");

      navigate(userType === "student" ? "/SmartHub" : "/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please check your credentials.");
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
        <Button
          variant="ghost"
          onClick={onNavigateToHome}
          className="mb-4 hover:bg-emerald-900/5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-900/10 to-slate-700/10 text-emerald-900 px-4 py-2 rounded-full mb-4 border border-emerald-800/20"
          >
            <Lock className="w-4 h-4" />
            <span className="text-sm">Secure Login</span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl mb-3 bg-gradient-to-r from-emerald-900 via-slate-800 to-teal-900 bg-clip-text text-transparent">
            Login to GPRS
          </h1>
          <p className="text-slate-600">Access your GPRS dashboard</p>
        </div>

        <Card className="border-2 border-emerald-900/10 shadow-xl p-6 bg-white/95 backdrop-blur-sm">
          {/* User Type Tabs */}
          <div className="flex gap-3 mb-6">
            <motion.button
              type="button"
              onClick={() => {
                setUserType("student");
                const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
                const savedUserType = localStorage.getItem(REMEMBER_USER_TYPE_KEY);
                if (!rememberMe || savedUserType !== "student" || email !== savedEmail) {
                  setEmail("");
                }
                setEmailError("");
              }}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
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
                const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
                const savedUserType = localStorage.getItem(REMEMBER_USER_TYPE_KEY);
                if (!rememberMe || savedUserType !== "supervisor" || email !== savedEmail) {
                  setEmail("");
                }
                setEmailError("");
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                University Email
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
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  onBlur={() => validateEmail(email)}
                  className={`pl-10 pr-4 py-6 bg-slate-50 border-slate-200 focus:border-emerald-800 focus:ring-emerald-800 ${
                    emailError ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  required
                />
              </div>
              {emailError && (
                <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{emailError}</span>
                </div>
              )}
              <p className="text-xs text-slate-500">
                {userType === "student"
                  ? "Must start with student ID and end with @stu.bu.edu.sa"
                  : "Must end with @bu.edu.sa"}
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-emerald-800 hover:text-emerald-900 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 py-6 bg-slate-50 border-slate-200 focus:border-emerald-800 focus:ring-emerald-800"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={setRememberMe}  
                className="border-emerald-800 data-[state=checked]:bg-emerald-800 data-[state=checked]:text-white"
               />
              <label
                htmlFor="remember"
                className="text-sm text-slate-600 cursor-pointer select-none"
              >
                Remember my email for next time
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !!emailError}
              className={`w-full py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 ${
                userType === "student"
                  ? "bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-slate-800"
                  : "bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-emerald-800"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                `Login as ${userType === "student" ? "Student" : "Supervisor"}`
              )}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onNavigateToSignUp}
                className="text-sm text-slate-600 hover:text-emerald-800 transition-colors"
              >
                Don't have an account?{" "}
                <span className="text-emerald-800 underline">Sign up</span>
              </button>
            </div>
          </form>
        </Card>
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowForgotPassword(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-2 border-emerald-900/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-800">
                Reset Password
              </h3>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Enter your university email and we'll send you a verification code to reset your
              password.
            </p>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-slate-700">
                  University Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder={
                      userType === "student"
                        ? "123456789@stu.bu.edu.sa"
                        : "professor@bu.edu.sa"
                    }
                    value={forgotPasswordEmail}
                    onChange={(e) => {
                      setForgotPasswordEmail(e.target.value);
                      setForgotPasswordError("");
                    }}
                    onBlur={() => validateForgotPasswordEmail(forgotPasswordEmail)}
                    className={`pl-10 pr-4 py-6 bg-slate-50 border-slate-200 focus:border-emerald-800 focus:ring-emerald-800 ${
                      forgotPasswordError ? "border-red-500 focus:border-red-500" : ""
                    }`}
                    required
                  />
                </div>
                {forgotPasswordError && (
                  <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{forgotPasswordError}</span>
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  {userType === "student"
                    ? "Must start with student ID and end with @stu.bu.edu.sa"
                    : "Must end with @bu.edu.sa"}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 py-6 border-2 border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="flex-1 py-6 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-slate-800"
                >
                  {forgotPasswordLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Code"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
       {showOTPScreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 border-emerald-900/10"
          >
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-emerald-800" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                Enter Verification Code
              </h3>
              <p className="text-sm text-slate-600">
                We sent a 6-digit code to<br />
                <span className="font-medium text-slate-800">{forgotPasswordEmail}</span>
              </p>
            </div>

            {/* OTP Inputs */}
            <div className="flex gap-3 justify-center mb-6">
              {otpValues.map((value, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={value}
                  onChange={(e) => {
                    const newValue = e.target.value.replace(/[^0-9]/g, "");
                    const newOtpValues = [...otpValues];
                    newOtpValues[index] = newValue;
                    setOtpValues(newOtpValues);
                    
                    // Auto-focus next input
                    if (newValue && index < 5) {
                      const nextInput = document.getElementById(`otp-${index + 1}`);
                      nextInput?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    // Handle backspace
                    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
                      const prevInput = document.getElementById(`otp-${index - 1}`);
                      prevInput?.focus();
                    }
                  }}
                  id={`otp-${index}`}
                  className="w-12 h-14 text-center text-2xl font-semibold border-2 border-slate-200 rounded-xl focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/20 outline-none transition-all"
                />
              ))}
            </div>

            {/* Error Message */}
            {otpError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {/* Resend Code */}
            {/* Timer & Resend Code */}
             <div className="text-center mb-6">
              {otpTimer > 0 ? (
            <p className="text-sm text-slate-600">
               Code expires in{" "}
            <span className="font-semibold text-emerald-800">
              {formatTimer(otpTimer)}
           </span>
         </p>
              ) : (
        <button
        type="button"
        onClick={async () => {
        setOtpTimer(300);
        setCanResendOTP(false);
        setOtpValues(["", "", "", "", "", ""]);
        
        // Mock resend
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast.success("New code sent!");
      }}
      className="text-sm text-slate-600 hover:text-emerald-800 transition-colors"
    >
      Didn't receive code?{" "}
      <span className="text-emerald-800 font-medium hover:underline">
        Resend
        </span>
       </button>
               )}
           </div>
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowOTPScreen(false);
                  setOtpValues(["", "", "", "", "", ""]);
                  setOtpError("");
                }}
                className="flex-1 py-6 border-2"
              >
                Cancel
              </Button>
              <Button
               type="button"
                 disabled={otpLoading || otpValues.some(v => !v)}
  onClick={handleVerifyOTP}  
  className="flex-1 py-6 bg-gradient-to-r from-emerald-800 to-emerald-900"
            >
   {otpLoading ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
               </>
              ) : (
           "Verify Code"
                   )}
          </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
      {/* ⭐⭐⭐ New Password Screen - جديد ⭐⭐⭐ */}
      {showNewPasswordScreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 border-emerald-900/10"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-emerald-800" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                Create New Password
              </h3>
              <p className="text-sm text-slate-600">
                Choose a strong password for your account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-slate-700">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError("");
                    }}
                    className="pl-10 pr-12 py-6 bg-slate-50 border-slate-200 focus:border-emerald-800 focus:ring-emerald-800"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError("");
                    }}
                    className="pl-10 pr-12 py-6 bg-slate-50 border-slate-200 focus:border-emerald-800 focus:ring-emerald-800"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-xs font-medium text-slate-700 mb-2">Password must contain:</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 8 ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${/(?=.*[a-z])/.test(newPassword) ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                    One lowercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${/(?=.*[A-Z])/.test(newPassword) ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                    One uppercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${/(?=.*\d)/.test(newPassword) ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                    One number
                  </li>
                </ul>
              </div>

              {/* Error Message */}
              {passwordError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewPasswordScreen(false);
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordError("");
                  }}
                  className="flex-1 py-6 border-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={newPasswordLoading}
                  className="flex-1 py-6 bg-gradient-to-r from-emerald-800 to-emerald-900"
                >
                  {newPasswordLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
