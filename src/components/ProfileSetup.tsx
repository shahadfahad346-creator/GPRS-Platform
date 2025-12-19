import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../Frontend/lib/auth-context";
import { InteractiveBackground } from "./Backgrounds";
import { updateUser } from "../../Frontend/lib/api";

interface ProfileSetupProps {
  onComplete: () => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const { user, updateProfile, updateUser, completeProfileSetup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    specialization: '',
  });

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    await updateProfile({
      name: formData.name.trim(),
      specialization: formData.specialization,
    });

    setLoading(false);
    setShowWelcome(true); // فقط نعرض شاشة الترحيب
  } catch (error) {
    console.error("Error updating profile:", error);
    setLoading(false);
  }
};

  if (showWelcome) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <InteractiveBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl mb-4 bg-gradient-to-r from-emerald-900 via-slate-800 to-teal-900 bg-clip-text text-transparent"
          >
            Your Profile is Set Up!
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-slate-600 mb-8"
          >
            Welcome to GPRS, ready to begin?
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
        <Button
      size="lg"
      onClick={async () => {
        console.log('[ProfileSetup] Start Now → completing setup in DB...');
        try {
          await completeProfileSetup(); // يُحدّث الـ DB + Context
          onComplete(); // ينتقل
        } catch (error) {
          // لا ينتقل إذا فشل
        }
      }}
      className="text-lg px-8 py-6 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-slate-800 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      Start Now
      <ArrowRight className="ml-2 w-5 h-5" />
    </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <InteractiveBackground />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-900/10 to-slate-700/10 text-emerald-900 px-4 py-2 rounded-full mb-4 border border-emerald-800/20"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Quick Setup</span>
          </motion.div>

          <h1 className="text-3xl md:text-4xl mb-3 bg-gradient-to-r from-emerald-900 via-slate-800 to-teal-900 bg-clip-text text-transparent">
            Complete Your Profile
          </h1>
          <p className="text-slate-600">
            Just a few details to get started
          </p>
        </div>

        <Card className="border-2 border-emerald-900/10 shadow-xl p-6 bg-white/95 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-12 border-emerald-900/20 focus:border-emerald-800 bg-white"
              />
            </div>

           {/* Specialization */}
<div className="space-y-2">
  <Label htmlFor="specialization">Specialization *</Label>
  <select
    id="specialization"
    value={formData.specialization}
    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
    required
    className="h-12 w-full rounded-md border border-emerald-900/20 bg-white px-3 text-sm focus:border-emerald-800 focus:ring-0"
  >
    <option value="" disabled>
      Select specialization
    </option>
    <option value="Computer Science">Computer Science</option>
    <option value="Systems and Networks">Systems and Networks</option>
    <option value="Information Technology">Information Technology</option>
    <option value="Software Engineering">Software Engineering</option>
  </select>
</div>


            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-slate-800 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading ? "Saving..." : "Continue"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <p className="text-xs text-center text-slate-500 pt-2">
              You can complete the rest later
            </p>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
function setUser(arg0: (prev: any) => any) {
  throw new Error("Function not implemented.");
}

