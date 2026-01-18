import React, { useState, useEffect } from 'react';
import { UserRole, Department } from '../types';
import { Api } from '../services/api';
import { DEPARTMENT_PROGRAMS } from '../constants';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Shield, GraduationCap, Building2, Phone, Mail, RotateCw } from 'lucide-react';
import OtpInput from '../components/OtpInput';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Registration Steps: 1 = Details, 2 = OTP Verification
  const [step, setStep] = useState<1 | 2>(1);
  const [otpMethod, setOtpMethod] = useState<'EMAIL' | 'MOBILE'>('EMAIL');
  const [otpInput, setOtpInput] = useState('');
  
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Resend Timer State
  const [resendTimer, setResendTimer] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    department: Department.CS,
    // Student specific
    studentId: '',
    program: '',
    // Faculty specific
    employeeId: '',
    designation: 'Assistant Professor'
  });

  const [policyAccepted, setPolicyAccepted] = useState(false);

  // Check URL params for role selection (e.g., from Footer)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam === 'faculty') {
        setRole(UserRole.FACULTY);
    } else {
        setRole(UserRole.STUDENT);
    }
  }, [location]);

  // Handle Resend Timer Countdown
  useEffect(() => {
    if (resendTimer > 0) {
        const timerId = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
        return () => clearTimeout(timerId);
    }
  }, [resendTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Logic for dependent dropdowns
    if (name === 'department') {
        setFormData({ 
            ...formData, 
            department: value as Department, 
            program: '' // Reset program when department changes
        });
    } else {
        setFormData({ ...formData, [name]: value });
    }
  };

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
      const contact = otpMethod === 'EMAIL' ? formData.email : formData.phoneNumber;
      await Api.sendOtp(contact, otpMethod);
      
      setStep(2); // Move to OTP step
      setResendTimer(30); // Start 30s cooldown
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Validate details and send OTP
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!formData.email.endsWith('@gmail.com')) {
      setError("Registration Restricted: You must use a valid Google account (@gmail.com).");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (role === UserRole.STUDENT && !formData.program) {
        setError("Please select a Program/Course.");
        return;
    }
    if (formData.phoneNumber.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!policyAccepted) {
      setError("You must accept the University Research & Plagiarism Policies.");
      return;
    }

    await initiateOtp();
  };

  // Step 2: Verify OTP and Create Account
  const handleOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const contact = otpMethod === 'EMAIL' ? formData.email : formData.phoneNumber;
      
      // New Secure Verify Call (Checks hash, expiry, attempts)
      const isValid = await Api.verifyOtp(contact, otpInput);
      
      if (!isValid) {
        // This usually won't be reached because Api throws, but for safety:
        throw new Error("Invalid code.");
      }

      // Proceed to Register
      await Api.register({
        ...formData,
        role: role
      });

      if (role === UserRole.FACULTY) {
        setSuccess("Registration Successful. Your account is PENDING approval by an Administrator. You will be notified via email once approved.");
      } else {
        setSuccess("Registration Successful. Redirecting to login...");
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
      if (resendTimer > 0) return;
      await initiateOtp();
  };

  // Get available programs for selected department
  const availablePrograms = DEPARTMENT_PROGRAMS[formData.department] || [];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Create Academic Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Join UniScholar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          {!success && step === 1 && (
            <>
              {/* Role Toggle */}
              <div className="flex justify-center mb-6 border-b border-slate-200 pb-6">
                <div className="bg-slate-100 p-1 rounded-lg flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.STUDENT)}
                    className={`px-4 py-2 rounded-md text-sm font-medium flex items-center transition-all ${
                      role === UserRole.STUDENT ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.FACULTY)}
                    className={`px-4 py-2 rounded-md text-sm font-medium flex items-center transition-all ${
                      role === UserRole.FACULTY ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Faculty / Reviewer
                  </button>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleDetailsSubmit}>
                
                {/* Common Fields */}
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Full Name</label>
                    <input name="name" type="text" required className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={formData.name} onChange={handleChange} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Email Address</label>
                      <input name="email" type="email" required placeholder="name@gmail.com" className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={formData.email} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Mobile Number</label>
                      <input name="phoneNumber" type="tel" required placeholder="10-digit number" className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={formData.phoneNumber} onChange={handleChange} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Department</label>
                    <select name="department" className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={formData.department} onChange={handleChange}>
                      {Object.values(Department).map(d => (<option key={d} value={d}>{d}</option>))}
                    </select>
                  </div>
                </div>

                {/* Role Specific Fields */}
                {role === UserRole.STUDENT ? (
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-100 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-2">Student Details</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Student ID / Enrollment No.</label>
                      <input name="studentId" type="text" required className="mt-1 block w-full border border-blue-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={formData.studentId} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Program / Course</label>
                      <select name="program" required className="mt-1 block w-full border border-blue-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={formData.program} onChange={handleChange}>
                        <option value="">Select Program for {formData.department}</option>
                        {availablePrograms.map(prog => (<option key={prog} value={prog}>{prog}</option>))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="bg-purple-50 p-4 rounded-md border border-purple-100 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-800 mb-2">Faculty Verification</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Employee ID</label>
                      <input name="employeeId" type="text" required className="mt-1 block w-full border border-purple-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" value={formData.employeeId} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Designation</label>
                      <select name="designation" required className="mt-1 block w-full border border-purple-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" value={formData.designation} onChange={handleChange}>
                        <option value="Lecturer">Lecturer</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Passwords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <input name="password" type="password" required className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={formData.password} onChange={handleChange} />
                    <PasswordStrengthMeter password={formData.password} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
                    <input name="confirmPassword" type="password" required className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" value={formData.confirmPassword} onChange={handleChange} />
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input id="policy" name="policy" type="checkbox" required checked={policyAccepted} onChange={(e) => setPolicyAccepted(e.target.checked)} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded" />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="policy" className="font-medium text-slate-700">
                      I accept the University Research Integrity & Plagiarism Policies.
                    </label>
                  </div>
                </div>

                {/* 2FA Method Selection */}
                <div className="border-t border-slate-200 pt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Verification Method (2FA)</label>
                  <div className="flex space-x-4">
                    <button type="button" onClick={() => setOtpMethod('EMAIL')} className={`flex-1 flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium ${otpMethod === 'EMAIL' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                      <Mail className="w-4 h-4 mr-2" /> Email
                    </button>
                    <button type="button" onClick={() => setOtpMethod('MOBILE')} className={`flex-1 flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium ${otpMethod === 'MOBILE' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                      <Phone className="w-4 h-4 mr-2" /> SMS
                    </button>
                  </div>
                </div>

                <div>
                  <button type="submit" disabled={loading} className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}>
                    {loading ? 'Processing...' : `Next: Verify via ${otpMethod === 'EMAIL' ? 'Email' : 'SMS'}`}
                  </button>
                </div>
              </form>
            </>
          )}

          {!success && step === 2 && (
             <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                     <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Enter Verification Code</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    We sent a 6-digit code to your {otpMethod === 'EMAIL' ? 'email' : 'phone'}.<br/>
                    <span className="text-xs text-orange-600">Please check your spam folder if not received.</span>
                  </p>
                </div>

                <div className="flex justify-center">
                    <OtpInput 
                        length={6} 
                        onChange={setOtpInput}
                        onComplete={(code) => {
                            setOtpInput(code);
                            // handleOtpSubmit(); 
                        }}
                        disabled={loading}
                    />
                </div>

                <div>
                  <button
                    onClick={() => handleOtpSubmit()}
                    disabled={loading || otpInput.length !== 6}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      loading || otpInput.length !== 6 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                  >
                    {loading ? 'Verifying...' : 'Verify & Complete Registration'}
                  </button>
                </div>
                
                <div className="text-center space-y-2">
                   {resendTimer > 0 ? (
                       <p className="text-sm text-slate-400">Resend code in {resendTimer}s</p>
                   ) : (
                       <button type="button" onClick={handleResend} className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center justify-center w-full">
                          <RotateCw className="w-4 h-4 mr-2" /> Resend Code
                       </button>
                   )}
                   <button type="button" onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-slate-700 underline block w-full mt-2">
                     Back to details
                   </button>
                </div>
             </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>
            <div className="mt-6 text-center">
                <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                  Log in here
                </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;