import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Api } from '../services/api';
import { ShieldCheck, User, ArrowLeft, RotateCw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole, User as UserType } from '../types';
import OtpInput from '../components/OtpInput';

const Login: React.FC = () => {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  
  // State for Flow: 'CREDENTIALS' -> '2FA'
  const [step, setStep] = useState<'CREDENTIALS' | '2FA'>('CREDENTIALS');
  const [tempUser, setTempUser] = useState<UserType | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP Data
  const [otp, setOtp] = useState('');

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Verify Credentials
      const user = await Api.login(email, password);
      
      // 2. Check 2FA Status
      if (user.twoFactorEnabled) {
          setTempUser(user);
          // Send OTP
          const contact = user.twoFactorMethod === 'SMS' && user.phoneNumber ? user.phoneNumber : user.email;
          await Api.sendOtp(contact, user.twoFactorMethod || 'EMAIL');
          setStep('2FA');
      } else {
          // No 2FA, complete login
          completeLogin(user);
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length !== 6 || !tempUser) return;
    
    setError(null);
    setLoading(true);

    try {
        const contact = tempUser.twoFactorMethod === 'SMS' && tempUser.phoneNumber ? tempUser.phoneNumber : tempUser.email;
        await Api.verifyOtp(contact, otp);
        completeLogin(tempUser);
    } catch (err: any) {
        setError(err.message || "Verification failed");
        setLoading(false);
    }
  };

  const completeLogin = (user: UserType) => {
      setSession(user);
      // Role-based redirect
      if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
  };

  const handleResendOtp = async () => {
      if (!tempUser) return;
      setError(null);
      const contact = tempUser.twoFactorMethod === 'SMS' && tempUser.phoneNumber ? tempUser.phoneNumber : tempUser.email;
      try {
          await Api.sendOtp(contact, tempUser.twoFactorMethod || 'EMAIL');
          alert('Code resent successfully');
      } catch (err: any) {
          setError(err.message);
      }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          {step === 'CREDENTIALS' ? 'UniScholar Login' : 'Security Verification'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {step === 'CREDENTIALS' ? 'Access for Students and Faculty' : `Please enter the code sent to your ${tempUser?.twoFactorMethod === 'SMS' ? 'mobile' : 'email'}`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                 <ShieldCheck className="h-5 w-5 text-red-500 mr-2" />
                 <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {step === 'CREDENTIALS' ? (
            <form className="space-y-6" onSubmit={handleCredentialSubmit}>
                <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email Address
                </label>
                <div className="mt-1">
                    <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@gmail.com"
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                </div>

                <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                </label>
                <div className="mt-1">
                    <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                </div>

                <div className="flex items-center justify-end">
                <div className="text-sm">
                    <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot your password?
                    </Link>
                </div>
                </div>

                <div>
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                    {loading ? 'Authenticating...' : 'Sign in'}
                </button>
                </div>
            </form>
          ) : (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 mb-4">
                        <User className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-sm text-slate-500 mb-6">
                        Hello <strong>{tempUser?.name}</strong>, for your security, we need to verify your identity.
                    </p>
                </div>

                <div className="flex justify-center">
                    <OtpInput 
                        length={6} 
                        onChange={setOtp} 
                        onComplete={(code) => {
                            setOtp(code);
                            // Optional: Auto-submit on complete?
                            // handleOtpSubmit(); 
                        }}
                        error={!!error}
                        disabled={loading}
                    />
                </div>

                <button
                    onClick={() => handleOtpSubmit()}
                    disabled={loading || otp.length !== 6}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading || otp.length !== 6 ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                    {loading ? 'Verifying...' : 'Verify Access'}
                </button>

                <div className="flex items-center justify-between mt-4">
                     <button 
                        type="button" 
                        onClick={() => setStep('CREDENTIALS')}
                        className="text-sm text-slate-500 hover:text-slate-700 flex items-center"
                     >
                        <ArrowLeft className="w-3 h-3 mr-1" /> Use different account
                     </button>
                     <button 
                        type="button" 
                        onClick={handleResendOtp}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center"
                     >
                        <RotateCw className="w-3 h-3 mr-1" /> Resend Code
                     </button>
                </div>
            </div>
          )}

          {step === 'CREDENTIALS' && (
            <div className="mt-6">
                <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">First time user?</span>
                </div>
                </div>

                <div className="mt-6 text-center">
                <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                    Create new account
                </Link>
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;