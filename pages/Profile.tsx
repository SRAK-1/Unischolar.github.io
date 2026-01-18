import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Api } from '../services/api';
import { User, UserRole, PaperType, Department, Paper, AccountStatus } from '../types';
import { RESEARCH_AREAS_LIST, DEGREE_LEVELS, MOCK_SUPERVISORS } from '../constants';
import { 
  User as UserIcon, BookOpen, Shield, Settings, FileText, 
  X, CheckCircle, AlertTriangle, GraduationCap, Building2, AlertCircle, Loader2, Camera, Lock, Bell, Key, Smartphone, Mail, Phone, Calendar, Eye, Activity
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';

type Tab = 'details' | 'academic' | 'research' | 'settings';

const Profile: React.FC = () => {
  const { user: authUser, refreshProfile } = useAuth(); // Read-only from context
  const navigate = useNavigate();
  
  // Local mutable state
  const [user, setUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  
  const [stats, setStats] = useState<any>(null);
  // Separate state for Review Activity Table
  const [reviewedPapers, setReviewedPapers] = useState<Paper[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>('details');
  
  // Editing & Status State
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Settings Feedback State
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  
  // Discard Modal State
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Settings Modals State
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // 2FA Form State
  const [twoFactorForm, setTwoFactorForm] = useState({
      enabled: false,
      method: 'EMAIL' as 'EMAIL' | 'SMS'
  });

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
      current: '',
      new: '',
      confirm: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Sync with auth user on load
  useEffect(() => {
    if (authUser) {
      // Deep copy to ensure we break references for dirty checking
      const userCopy = JSON.parse(JSON.stringify(authUser));
      setUser(userCopy);
      setOriginalUser(JSON.parse(JSON.stringify(authUser)));
      setTwoFactorForm({ 
          enabled: userCopy.twoFactorEnabled || false, 
          method: userCopy.twoFactorMethod || 'EMAIL' 
      });
      
      // Fetch stats
      Api.getStats(authUser).then(setStats);

      // Fetch Review Activity if Faculty
      if (authUser.role === UserRole.FACULTY || authUser.role === UserRole.ADMIN) {
          Api.getPapersForUser(authUser).then(papers => {
              // Filter to show only reviewed papers or assigned ones in the list
              setReviewedPapers(papers);
          });
      }
    }
  }, [authUser]);

  // Check for changes whenever user state updates
  useEffect(() => {
    if (user && originalUser) {
      const isDirty = JSON.stringify(user) !== JSON.stringify(originalUser);
      setHasChanges(isDirty);
      // Reset status if user keeps typing after an error or success
      if (isDirty && (saveStatus === 'success' || saveStatus === 'error')) {
         setSaveStatus('idle');
      }
    }
  }, [user, originalUser, saveStatus]);

  if (!authUser || !user) return <div className="p-8 text-center">Please login to view profile.</div>;

  const isStudent = user.role === UserRole.STUDENT;
  const isFaculty = user.role === UserRole.FACULTY;
  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrorMessage('');
    try {
      if (!user) return;
      
      // Basic validation for Student
      if (isStudent && !user.supervisorName) {
         throw new Error("Supervisor selection is mandatory for academic profiles.");
      }
      
      if (isStudent && !user.researchType) {
          throw new Error("Please select your primary Research Type.");
      }

      // API Call
      const updatedUser = await Api.updateProfile(authUser, user);
      
      // Update local baseline to new saved state
      setOriginalUser(JSON.parse(JSON.stringify(updatedUser)));
      setUser(JSON.parse(JSON.stringify(updatedUser))); // Ensure exact match
      
      // Manually update localStorage via context refresh mechanism
      const existingStorage = localStorage.getItem('unischolar_user');
      if (existingStorage) {
          localStorage.setItem('unischolar_user', JSON.stringify(updatedUser));
      }
      await refreshProfile(); 
      
      setSaveStatus('success');
      setHasChanges(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err.message || "Failed to update profile");
    }
  };

  const initiateCancel = () => {
      setShowDiscardConfirm(true);
  };

  const confirmDiscard = () => {
    if (originalUser) {
        setUser(JSON.parse(JSON.stringify(originalUser))); // Revert to original
        setTwoFactorForm({ 
            enabled: originalUser.twoFactorEnabled || false, 
            method: originalUser.twoFactorMethod || 'EMAIL' 
        });
    }
    setHasChanges(false);
    setSaveStatus('idle');
    setErrorMessage('');
    setShowDiscardConfirm(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
         const file = e.target.files[0];
         const reader = new FileReader();
         reader.onloadend = () => {
             setUser(prev => prev ? ({ ...prev, profileImage: reader.result as string }) : null);
         };
         reader.readAsDataURL(file);
     }
  };

  // --- 2FA Handlers ---
  const save2FA = async () => {
      if (!user) return;
      const updatedUser = { 
          ...user, 
          twoFactorEnabled: twoFactorForm.enabled, 
          twoFactorMethod: twoFactorForm.method 
      };
      setUser(updatedUser);
      setIs2FAModalOpen(false);
      setSettingsMessage("2FA Configuration updated. Please click 'Save Changes' to persist.");
      setTimeout(() => setSettingsMessage(null), 4000);
  };

  // --- Password Handlers ---
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: 'None' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return { score, label: labels[Math.min(score, 4)] };
  };

  const handleChangePassword = async () => {
      setPasswordError(null);
      setPasswordSuccess(null);
      
      if (passwordForm.new !== passwordForm.confirm) {
          setPasswordError("New passwords do not match.");
          return;
      }
      if (passwordForm.new === passwordForm.current) {
          setPasswordError("New password must be different from the current password.");
          return;
      }
      
      const strength = getPasswordStrength(passwordForm.new);
      if (strength.score < 3) { // Require at least Fair
          setPasswordError("Password is too weak. Ensure at least 8 chars, mixed case, numbers.");
          return;
      }

      setPasswordLoading(true);
      try {
          await Api.changePassword(authUser!, passwordForm.current, passwordForm.new);
          setPasswordSuccess("Password changed successfully!");
          setPasswordForm({ current: '', new: '', confirm: '' });
          setTimeout(() => setIsPasswordModalOpen(false), 2000);
      } catch (err: any) {
          setPasswordError(err.message);
      } finally {
          setPasswordLoading(false);
      }
  };

  // --- Notification Handler ---
  const toggleNotifications = () => {
      if (!user) return;
      const newVal = !user.notificationsEnabled;
      setUser({ ...user, notificationsEnabled: newVal });
      setSettingsMessage(newVal ? "Notifications Enabled" : "Notifications Disabled");
      setTimeout(() => setSettingsMessage(null), 2000);
  };

  // Helper for inline input styling
  const inlineInputClass = "w-full border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none bg-transparent py-1 text-slate-900 placeholder-slate-400 transition-all";
  const inlineSelectClass = "w-full border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none bg-transparent py-1 text-slate-900 cursor-pointer transition-all";
  // Read-only style for Faculty fixed fields
  const readOnlyClass = "w-full border-b border-transparent bg-transparent py-1 text-slate-500 cursor-not-allowed";

  // Tab Labels based on Role
  const academicLabel = isStudent ? 'Academic' : (isFaculty ? 'Faculty Role' : 'Permissions');
  const researchLabel = isStudent ? 'My Research' : (isFaculty ? 'Review Activity' : 'System Logs');

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      
      {/* 1. Header Profile Card */}
      <div className="bg-slate-900 text-white pb-20 pt-10">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
             <div className="relative group">
                 <div className="h-28 w-28 bg-slate-800 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center">
                      {user.profileImage ? (
                          <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                          <UserIcon size={48} className="text-slate-400" />
                      )}
                 </div>
                 <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="text-white w-8 h-8" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                 </label>
             </div>
             <div className="text-center md:text-left pb-4">
                 <h1 className="text-3xl font-bold uppercase tracking-wide">{user.name}</h1>
                 <div className="flex items-center justify-center md:justify-start space-x-3 text-slate-300 mt-1 text-sm">
                    <span className="flex items-center">
                        {isAdmin ? <Shield className="w-4 h-4 mr-1.5 text-yellow-400" /> : <GraduationCap className="w-4 h-4 mr-1.5" />} 
                        {isStudent ? 'Student Researcher' : (isFaculty ? user.designation : 'Administrator')}
                    </span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                    <span className="flex items-center"><Building2 className="w-4 h-4 mr-1.5" /> {user.department}</span>
                 </div>
             </div>
         </div>
      </div>
      
      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 mb-8">
         <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-wrap">
             {[
                 { id: 'details', label: 'Details', icon: UserIcon },
                 { id: 'academic', label: academicLabel, icon: isAdmin ? Shield : BookOpen },
                 { id: 'research', label: researchLabel, icon: Activity },
                 { id: 'settings', label: 'Settings', icon: Settings }
             ].map((tab) => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`flex-1 flex items-center justify-center py-4 px-4 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === tab.id 
                        ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                 >
                     <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
                     {tab.label}
                 </button>
             ))}
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Main Content Area */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* TAB: DETAILS (OVERVIEW) */}
            {activeTab === 'details' && (
                <div className="bg-white shadow-sm rounded-lg border border-slate-200 p-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center pb-4 border-b border-slate-100">
                        Personal Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                        <div className="group">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                            <input 
                                type="text"
                                className={inlineInputClass}
                                value={user.name}
                                onChange={(e) => setUser({...user, name: e.target.value})}
                            />
                        </div>
                        <div className="group">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                            <div className="flex items-center text-slate-600">
                                <Mail className="w-4 h-4 mr-2 text-slate-400" />
                                <span className="text-slate-500">{user.email}</span>
                            </div>
                        </div>
                        <div className="group">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                {isStudent ? 'Student ID' : (isFaculty ? 'Employee ID' : 'Admin ID')}
                            </label>
                            <input 
                                type="text"
                                className={isFaculty ? readOnlyClass : inlineInputClass}
                                disabled={isFaculty}
                                value={isStudent ? user.studentId : user.employeeId || 'ADM-001'}
                                onChange={(e) => isStudent ? setUser({...user, studentId: e.target.value}) : setUser({...user, employeeId: e.target.value})}
                            />
                            {isFaculty && <span className="text-[10px] text-slate-400">Managed by Admin</span>}
                        </div>
                        <div className="group">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Number</label>
                            <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-2 text-slate-400" />
                                <input 
                                    type="text"
                                    className={inlineInputClass}
                                    value={user.phoneNumber || ''}
                                    onChange={(e) => setUser({...user, phoneNumber: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Department</label>
                            {isFaculty ? (
                                <div className="py-1 text-slate-500 flex items-center">
                                    <Lock className="w-3 h-3 mr-1" /> {user.department}
                                </div>
                            ) : (
                                <select 
                                    value={user.department}
                                    onChange={(e) => setUser({...user, department: e.target.value as Department})}
                                    className={inlineSelectClass}
                                >
                                    {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            )}
                        </div>
                        {isStudent && (
                            <div className="group">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Program</label>
                                <input 
                                    type="text"
                                    className={inlineInputClass}
                                    value={user.program}
                                    onChange={(e) => setUser({...user, program: e.target.value})}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: ACADEMIC / FACULTY ROLE */}
            {activeTab === 'academic' && (
                <div className="bg-white shadow-sm rounded-lg border border-slate-200 p-8">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800">
                            {isAdmin ? 'System Scope' : 'Academic Profile'}
                        </h3>
                        {isFaculty && (
                            <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${user.status === AccountStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                Account Status: {user.status}
                            </span>
                        )}
                    </div>

                    <div className="space-y-8">
                        {/* Student Fields */}
                        {isStudent && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Degree Level</label>
                                        <select 
                                            value={user.degreeLevel || 'Undergraduate'}
                                            onChange={(e) => setUser({...user, degreeLevel: e.target.value as any})}
                                            className={inlineSelectClass}
                                        >
                                            {DEGREE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Batch / Academic Year</label>
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                            <input 
                                                type="text" 
                                                value={user.academicYear || ''}
                                                onChange={(e) => setUser({...user, academicYear: e.target.value})}
                                                className={inlineInputClass}
                                                placeholder="e.g. 2024-2025"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                        Assigned Supervisor <span className="text-red-500">*</span>
                                    </label>
                                    <select 
                                        value={user.supervisorName || ''}
                                        onChange={(e) => setUser({...user, supervisorName: e.target.value})}
                                        className={`w-full p-2 rounded border ${!user.supervisorName ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'}`}
                                    >
                                        <option value="">Select Official Supervisor...</option>
                                        {MOCK_SUPERVISORS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {!user.supervisorName && (
                                        <p className="text-xs text-red-500 mt-1">Mandatory for submitting papers.</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Research Topic</label>
                                    <input 
                                        type="text" 
                                        value={user.thesisTitle || ''}
                                        onChange={(e) => setUser({...user, thesisTitle: e.target.value})}
                                        className="w-full border border-slate-300 rounded p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your thesis or project title..."
                                    />
                                </div>
                            </>
                        )}

                        {/* Faculty Fields */}
                        {isFaculty && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Designation</label>
                                    <div className="py-2 text-slate-700 bg-slate-50 px-3 rounded border border-slate-200 flex items-center justify-between">
                                        {user.designation} <Lock className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Contact Admin to update designation.</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">System Role</label>
                                    <div className="py-2 text-slate-700 bg-slate-50 px-3 rounded border border-slate-200 flex items-center justify-between">
                                        {user.reviewerRole || 'Reviewer'} <Lock className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Determines your review permissions.</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Research Areas Tag Input (Mock for UI) */}
                        {!isAdmin && (
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Focus Areas (Max 5)</label>
                                <div className="flex flex-wrap gap-2">
                                    {RESEARCH_AREAS_LIST.slice(0, 10).map(area => {
                                        const isSelected = (user.researchAreas || []).includes(area);
                                        return (
                                            <button
                                                key={area}
                                                // Simplified toggle logic
                                                onClick={() => {
                                                    const current = user.researchAreas || [];
                                                    if (current.includes(area)) {
                                                        setUser({ ...user, researchAreas: current.filter(a => a !== area) });
                                                    } else {
                                                        if (current.length < 5) {
                                                            setUser({ ...user, researchAreas: [...current, area] });
                                                        }
                                                    }
                                                }}
                                                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                                    isSelected 
                                                    ? 'bg-blue-600 text-white border-blue-600' 
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                                                }`}
                                            >
                                                {area}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: RESEARCH / ACTIVITY */}
            {activeTab === 'research' && (
                <div className="space-y-6">
                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {isStudent ? (
                                <>
                                    <StatCard label="Total Submissions" value={stats.total} />
                                    <StatCard label="Under Review" value={stats.pending} color="blue" />
                                    <StatCard label="Revisions" value={stats.revision} color="yellow" />
                                    <StatCard label="Approved" value={stats.approved} color="green" />
                                </>
                            ) : isAdmin ? (
                                <>
                                    <StatCard label="Total Users" value={stats.total} />
                                    <StatCard label="Active Sessions" value="12" color="green" />
                                    <StatCard label="Pending Papers" value={stats.pending} color="blue" />
                                    <StatCard label="Alerts" value="0" color="red" />
                                </>
                            ) : (
                                <>
                                    <StatCard label="Completed" value={stats.reviewed} color="green" />
                                    <StatCard label="Pending" value={stats.pending} color="blue" />
                                    <StatCard label="My Students" value={stats.myStudents} color="purple" />
                                    <StatCard label="Avg Time" value="4d" color="gray" />
                                </>
                            )}
                        </div>
                    )}

                    {/* Activity Table for Faculty */}
                    {isFaculty && (
                        <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-200 bg-slate-50">
                                <h3 className="font-bold text-slate-800">Recent Review Activity</h3>
                            </div>
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Paper</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {reviewedPapers.length === 0 ? (
                                        <tr><td colSpan={4} className="p-4 text-center text-sm text-slate-500">No review activity recorded yet.</td></tr>
                                    ) : (
                                        reviewedPapers.map(p => (
                                            <tr key={p.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-slate-900 truncate max-w-xs">{p.title}</div>
                                                    <div className="text-xs text-slate-500">{new Date(p.lastUpdated).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">{p.uploaderName}</td>
                                                <td className="px-6 py-4"><StatusBadge status={p.status} size="sm" /></td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link to={`/paper/${p.id}`} className="text-blue-600 hover:text-blue-900 text-xs font-medium">View</Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Dashboard Link Box (Secondary) */}
                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 flex flex-row items-center justify-between">
                         <div>
                             <h3 className="text-sm font-bold text-slate-900">Need to access full dashboard?</h3>
                             <p className="text-xs text-slate-500 mt-1">
                                Go to the main dashboard to view all pending tasks and submissions.
                             </p>
                         </div>
                         <button 
                            onClick={() => navigate('/dashboard')}
                            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded text-sm font-medium hover:bg-slate-100 transition-colors"
                         >
                             Open Dashboard
                         </button>
                    </div>
                </div>
            )}

            {/* TAB: SETTINGS (Integrated from previous turn) */}
            {activeTab === 'settings' && (
                <div className="bg-white shadow-sm rounded-lg border border-slate-200 p-8 relative">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center pb-4 border-b border-slate-100">
                        Account & Security
                    </h3>

                    {settingsMessage && (
                        <div className="mb-6 bg-slate-800 text-white px-4 py-3 rounded text-sm shadow-lg animate-in fade-in slide-in-from-top-1 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                            {settingsMessage}
                        </div>
                    )}
                    
                    <div className="space-y-8">
                        {/* 2FA */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-start">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mr-4">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-slate-900">Two-Factor Authentication</h4>
                                    <p className="text-sm text-slate-500 mt-1 max-w-sm">
                                        Secure your account by requiring a code from your phone or email when logging in.
                                    </p>
                                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {user.twoFactorEnabled ? `Enabled (${user.twoFactorMethod})` : 'Disabled'}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setTwoFactorForm({
                                        enabled: user.twoFactorEnabled || false,
                                        method: user.twoFactorMethod || 'EMAIL'
                                    });
                                    setIs2FAModalOpen(true);
                                }}
                                className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
                            >
                                Configure
                            </button>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Password */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-start">
                                <div className="p-3 bg-slate-100 text-slate-600 rounded-lg mr-4">
                                    <Key className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-slate-900">Change Password</h4>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Update your password regularly to keep your account safe.
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
                            >
                                Update
                            </button>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Notifications */}
                         <div className="flex items-center justify-between">
                            <div className="flex items-start">
                                <div className={`p-3 rounded-lg mr-4 ${user.notificationsEnabled ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Bell className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-slate-900">Email Notifications</h4>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Receive updates about submission status, reviews, and system alerts.
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={toggleNotifications}
                                className={`flex items-center px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                                    user.notificationsEnabled 
                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                {user.notificationsEnabled ? (
                                    <>
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Enabled
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full mr-2"></span> Disabled
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
         </div>

         {/* Sidebar Area (Widgets) */}
         <div className="space-y-6">
            {/* Supervisor Status Widget (Student Only) */}
            {isStudent && (
                 <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                     <h4 className="font-bold text-slate-800 mb-4 text-sm">Supervisor Status</h4>
                     {user.supervisorName ? (
                         <div className="flex items-start">
                             <CheckCircle className="w-5 h-5 mr-3 text-green-600 mt-0.5" />
                             <div>
                                 <p className="font-medium text-green-700 text-sm">Assigned</p>
                                 <p className="text-xs text-slate-500 mt-1">{user.supervisorName}</p>
                             </div>
                         </div>
                     ) : (
                         <div className="flex items-start">
                             <AlertTriangle className="w-5 h-5 mr-3 text-red-600 mt-0.5" />
                             <div>
                                <p className="font-medium text-red-600 text-sm">Not Selected</p>
                                <p className="text-xs text-slate-500 mt-1">Please update your Academic profile.</p>
                             </div>
                         </div>
                     )}
                 </div>
            )}
         </div>

      </div>

      {/* Floating Save Action Bar */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 transition-all duration-300 z-40 transform ${hasChanges ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
      >
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 lg:px-8 space-y-3 sm:space-y-0">
           
           <div className="flex items-center">
             {saveStatus === 'error' ? (
                <div className="flex items-center text-red-600">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span className="text-sm font-medium">{errorMessage}</span>
                </div>
             ) : saveStatus === 'success' ? (
                <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="text-sm font-medium">Changes saved successfully!</span>
                </div>
             ) : (
                <div className="flex items-center text-slate-700">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="text-sm font-medium">You have unsaved changes</span>
                </div>
             )}
           </div>

           <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button 
                 onClick={initiateCancel}
                 className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 text-sm font-medium"
              >
                 Discard
              </button>
              <button 
                 onClick={handleSave}
                 disabled={saveStatus === 'saving'}
                 className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center justify-center disabled:opacity-70"
              >
                 {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                 {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
              </button>
           </div>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Discard Changes?</h3>
                  <p className="text-sm text-slate-600 mb-4">
                      Are you sure you want to discard your unsaved changes? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-3">
                      <button 
                          onClick={() => setShowDiscardConfirm(false)}
                          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmDiscard}
                          className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-md"
                      >
                          Discard
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 2FA Modal */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Two-Factor Authentication</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-md">
                        <span className="text-sm font-medium text-slate-700">Enable 2FA</span>
                        <button 
                           onClick={() => setTwoFactorForm({...twoFactorForm, enabled: !twoFactorForm.enabled})}
                           className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${twoFactorForm.enabled ? 'bg-green-500' : 'bg-slate-200'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${twoFactorForm.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    {twoFactorForm.enabled && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Delivery Method</label>
                            <div className="flex space-x-3">
                                <button 
                                    onClick={() => setTwoFactorForm({...twoFactorForm, method: 'EMAIL'})}
                                    className={`flex-1 py-2 text-sm font-medium rounded border ${twoFactorForm.method === 'EMAIL' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-300 text-slate-600'}`}
                                >
                                    Email
                                </button>
                                <button 
                                    onClick={() => setTwoFactorForm({...twoFactorForm, method: 'SMS'})}
                                    className={`flex-1 py-2 text-sm font-medium rounded border ${twoFactorForm.method === 'SMS' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-300 text-slate-600'}`}
                                >
                                    SMS
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button onClick={() => setIs2FAModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md">Cancel</button>
                        <button onClick={save2FA} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">Update 2FA</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Change Password</h3>
                
                {passwordError && (
                    <div className="mb-4 bg-red-50 text-red-700 p-3 rounded text-sm flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" /> {passwordError}
                    </div>
                )}
                {passwordSuccess && (
                    <div className="mb-4 bg-green-50 text-green-700 p-3 rounded text-sm flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" /> {passwordSuccess}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Current Password</label>
                        <input 
                            type="password" 
                            className="mt-1 block w-full border border-slate-300 rounded-md p-2 text-sm"
                            value={passwordForm.current}
                            onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">New Password</label>
                        <input 
                            type="password" 
                            className="mt-1 block w-full border border-slate-300 rounded-md p-2 text-sm"
                            value={passwordForm.new}
                            onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                        />
                        {passwordForm.new && (
                            <div className="mt-1 flex items-center justify-between text-xs">
                                <span className="text-slate-500">Strength:</span>
                                <span className={`font-bold ${
                                    getPasswordStrength(passwordForm.new).score < 2 ? 'text-red-500' : 
                                    getPasswordStrength(passwordForm.new).score < 4 ? 'text-yellow-500' : 'text-green-500'
                                }`}>
                                    {getPasswordStrength(passwordForm.new).label}
                                </span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
                        <input 
                            type="password" 
                            className="mt-1 block w-full border border-slate-300 rounded-md p-2 text-sm"
                            value={passwordForm.confirm}
                            onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md">Cancel</button>
                        <button 
                            onClick={handleChangePassword}
                            disabled={passwordLoading} 
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70"
                        >
                            {passwordLoading ? 'Updating...' : 'Change Password'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

// StatCard Component
const StatCard = ({ label, value, color = "gray" }: { label: string; value: string | number; color?: string }) => {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        green: 'bg-green-50 border-green-200 text-green-700',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
        red: 'bg-red-50 border-red-200 text-red-700',
        gray: 'bg-slate-50 border-slate-200 text-slate-700',
    };
    
    return (
        <div className={`p-4 rounded-lg border shadow-sm flex flex-col items-center justify-center text-center ${colors[color] || colors.gray}`}>
             <span className="text-2xl font-bold block mb-1">{value}</span>
             <span className="text-xs uppercase tracking-wider font-bold opacity-80">{label}</span>
        </div>
    );
};

export default Profile;