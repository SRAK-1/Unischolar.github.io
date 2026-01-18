import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, ArrowLeft, KeyRound, CheckCircle, RotateCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Api } from '../services/api';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  // Steps: 1 = Email Input, 2 = OTP + New Password, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resend Timer
  const [resendTimer, setResendTimer] = useState(0);

  // Handle Resend Timer Countdown
  useEffect(() => {
    if (resendTimer > 0) {
        const timerId = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
        return () => clearTimeout(timerId);
    }
  }, [resendTimer]);

  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length > 7) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const PasswordStrengthMeter = ({ password }: { password: string }) => {
      const strength = getPasswordStrength(password);
      const labels = ["Weak", "Fair", "Good", "Strong"];
      const colors = ["bg-gray-200", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
      
      if (!password) return null;

      return (
          <div className="mt-2">
              <div className="flex h-1.5 space-x-1 mb-1">
                  {[1, 2, 3, 4].map((level) => (
                      <div 
                        key={level} 
                        className={`flex-1 rounded-full transition-colors duration-300 ${strength >= level ? colors[strength] : 'bg-gray-200'}`}
                      ></div>
                  ))}
              </div>
              <p className={`text-xs text-right ${strength < 2 ? 'text-red-500' : strength === 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {labels[Math.min(strength - 1, 3)] || 'Too Short'}
              </p>
          </div>
      );
  };

  const initiateOtp = async () => {
    setLoading(true);
    setError(null);
    try {
        await Api.sendOtp(email, 'EMAIL');
        setStep(2);
        setResendTimer(30);
    } catch (err: any) {
        setError("Failed to send verification code. Please check the email address.");
    } finally {
        setLoading(false);
    }
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.endsWith('@gmail.com')) {
        setError("Please enter a valid Google account (@gmail.com)");
        return;
    }

    await initiateOtp();
  };

  // Step 2: Verify OTP and Reset
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    if (newPassword.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
    }

    setLoading(true);
    try {
        await Api.resetPassword(email, otp, newPassword);
        setStep(3);
        // Redirect after delay
        setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
        setError(err.message || "Reset failed. Invalid or expired Code.");
    } finally {
        setLoading(false);
    }
  };

  const handleResend = async () => {
      if (resendTimer > 0) return;
      await initiateOtp();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Secure Account Recovery
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                 <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form className="space-y-6" onSubmit={handleRequestOtp}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@gmail.com"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">We will send a One-Time Password (OTP) to this email.</p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {loading ? 'Sending Code...' : 'Get Verification Code'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Verify OTP & New Password */}
          {step === 2 && (
             <form className="space-y-6" onSubmit={handleReset}>
                <div className="text-center mb-4">
                   <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-2">
                     <ShieldCheck className="h-6 w-6 text-blue-600" />
                   </div>
                   <p className="text-sm text-gray-600">Enter the code sent to <strong>{email}</strong></p>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700">Verification Code</label>
                   <input
                     type="text"
                     required
                     maxLength={6}
                     placeholder="------"
                     className="mt-1 block w-full text-center text-xl tracking-widest border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                     value={otp}
                     onChange={(e) => setOtp(e.target.value)}
                   />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700">New Password</label>
                   <input
                     type="password"
                     required
                     className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                     value={newPassword}
                     onChange={(e) => setNewPassword(e.target.value)}
                   />
                   <PasswordStrengthMeter password={newPassword} />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
                   <input
                     type="password"
                     required
                     className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                   />
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-blue-400 cursor-wait' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </div>
                
                <div className="text-center mt-4">
                    {resendTimer > 0 ? (
                       <p className="text-sm text-slate-400">Resend code in {resendTimer}s</p>
                   ) : (
                       <button type="button" onClick={handleResend} className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center justify-center w-full">
                          <RotateCw className="w-4 h-4 mr-2" /> Resend Code
                       </button>
                   )}
                </div>
             </form>
          )}

          {/* STEP 3: Success */}
          {step === 3 && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Password Reset Successful</h3>
              <p className="mt-1 text-sm text-gray-500">
                You can now login with your new credentials.
              </p>
              <div className="mt-6">
                 <p className="text-sm text-slate-400">Redirecting to login...</p>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
             <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center justify-center">
               <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
             </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;