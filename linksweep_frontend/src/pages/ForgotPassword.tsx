import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "../services/Auth";
import AuthLeftSide from '@/components/AuthLeftSide';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'email' | 'otp' | 'password'>('email');
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await AuthService.requestPasswordReset(email);
      
      if (response.success && response.data?.token) {
        setResetToken(response.data.token);
        setCurrentStep('otp');
        toast({
          title: "OTP Sent",
          description: "Check your email for a 6-digit OTP code to continue.",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to send OTP. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Forgot password failed:", error);
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP code.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingOtp(true);
    try {
      const response = await AuthService.verifyOtp(email, otp, resetToken);
      
      if (response.success) {
        setCurrentStep('password');
        toast({
          title: "OTP Verified",
          description: "Please enter your new password.",
        });
      } else {
        toast({
          title: "Invalid OTP",
          description: response.error || "Invalid or expired OTP. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OTP verification failed:", error);
      toast({
        title: "Invalid OTP",
        description: "Invalid or expired OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      toast({
        title: "Invalid Password",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const response = await AuthService.resetPassword(resetToken, newPassword);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Password reset successfully. You can now log in.",
        });
        navigate("/login");
      } else {
        toast({
          title: "Reset Failed",
          description: response.error || "Failed to reset password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Password reset failed:", error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResendingOtp(true);
    try {
      const response = await AuthService.requestPasswordReset(email);
      
      if (response.success && response.data?.token) {
        setResetToken(response.data.token);
        toast({
          title: "OTP Resent",
          description: "A new OTP has been sent to your email.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to resend OTP. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Resend OTP failed:", error);
      toast({
        title: "Error",
        description: "Failed to resend OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResendingOtp(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - 60% */}
      <AuthLeftSide 
        title="Reset Your Password"
        subtitle="Don't worry, we'll help you get back to managing your links in no time."
        quote="Every expert was once a beginner."
        quoteAuthor="Your Journey Continues Here"
      />

      {/* Right Side - Forgot Password Form */}
      <div className="lg:w-2/5 w-full flex items-center justify-center bg-background px-8 py-12">
        <div className="w-full max-w-md">
          {currentStep === 'email' && (
            <>
              {/* Email Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Forgot Password
                </h2>
                <p className="text-gray-600">
                  Enter your email address and we'll send you an OTP to reset
                  your password
                </p>
              </div>

              {/* Email Form */}
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg">
                      📧
                    </span>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </form>
            </>
          )}

          {currentStep === 'otp' && (
            <div className="text-center">
              <div className="mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔐</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Enter OTP
                </h2>
                <p className="text-gray-600">
                  We've sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              <div className="mb-6">
                <Label className="text-sm font-medium text-gray-700 mb-4 block">
                  Enter 6-digit OTP
                </Label>
                <div className="flex justify-center mb-6">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    disabled={isSubmittingOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot
                        index={0}
                        className="w-12 h-12 text-lg font-bold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <InputOTPSlot
                        index={1}
                        className="w-12 h-12 text-lg font-bold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <InputOTPSlot
                        index={2}
                        className="w-12 h-12 text-lg font-bold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <InputOTPSlot
                        index={3}
                        className="w-12 h-12 text-lg font-bold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <InputOTPSlot
                        index={4}
                        className="w-12 h-12 text-lg font-bold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <InputOTPSlot
                        index={5}
                        className="w-12 h-12 text-lg font-bold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleVerifyOtp}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isSubmittingOtp || otp.length !== 6}
                >
                  {isSubmittingOtp ? "Verifying..." : "Verify OTP"}
                </Button>

                <Button
                  onClick={handleResendOtp}
                  variant="outline"
                  className="w-full h-12 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-all duration-200"
                  disabled={isResendingOtp}
                >
                  {isResendingOtp ? "Resending..." : "Resend OTP"}
                </Button>

                <Button
                  onClick={() => {
                    setCurrentStep('email');
                    setOtp("");
                    setResetToken("");
                  }}
                  variant="ghost"
                  className="w-full text-gray-500 hover:text-gray-700"
                >
                  Use Different Email
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'password' && (
            <div className="text-center">
              <div className="mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Reset Password
                </h2>
                <p className="text-gray-600">
                  Enter your new password
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label
                    htmlFor="newPassword"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    New Password
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg">
                      🔒
                    </span>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                      disabled={isResettingPassword}
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg">
                      🔒
                    </span>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                      disabled={isResettingPassword}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleResetPassword}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isResettingPassword || !newPassword.trim() || !confirmPassword.trim()}
                >
                  {isResettingPassword ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </div>
          )}

          {/* Back to Sign In Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;