import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Api } from '../services/api';
import { UserRole, AuditLog, User, AccountStatus, Department } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Users, FileText, AlertTriangle, Lock, Unlock, Search, ArrowUpDown, ChevronUp, ChevronDown, ShieldAlert, History, Download, User as UserIcon, Filter, Eye, X, Check, Ban, ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'audit'>('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // --- FILTERS STATE ---
  const [userFilters, setUserFilters] = useState({
      search: '',
      role: 'all',
      status: 'all',
      department: 'all'
  });

  const [auditFilters, setAuditFilters] = useState({
      search: '',
      action: 'all',
      role: 'all',
      dateFrom: '',
      dateTo: ''
  });

  // --- PAGINATION STATE ---
  const [logsPage, setLogsPage] = useState(1);
  const [logsPerPage] = useState(15);

  // --- MODAL STATES ---
  const [userModal, setUserModal] = useState<{ isOpen: boolean; user: User | null; mode: 'view' | 'suspend' | 'approve' | null }>({
      isOpen: false, user: null, mode: null
  });
  const [logModal, setLogModal] = useState<{ isOpen: boolean; log: AuditLog | null }>({
      isOpen: false, log: null
  });
  const [statusReason, setStatusReason] = useState('');

  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>(null);

  // Focus management
  const modalRef = useRef<HTMLDivElement>(null);

  // STRICT Role Check and Redirect
  useEffect(() => {
    if (!user) {
        navigate('/login', { replace: true });
        return;
    }
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
        alert("Access Denied: You need Administrator privileges to view this page.");
        navigate('/dashboard', { replace: true });
        return;
    }
    const loadData = async () => {
        try {
            const statsData = await Api.getStats(user);
            const usersData = await Api.getAllUsers(user);
            setStats(statsData);
            setAllUsers(usersData);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, [user, navigate]);

  // Handle Modal Open/Close Focus Management
  useEffect(() => {
    if (userModal.isOpen || logModal.isOpen) {
      setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelector('button, input, textarea');
          if (focusable) (focusable as HTMLElement).focus();
        }
      }, 100);
    }
  }, [userModal.isOpen, logModal.isOpen]);

  const openUserModal = (targetUser: User, mode: 'view' | 'suspend' | 'approve') => {
      setUserModal({ isOpen: true, user: targetUser, mode });
      setStatusReason('');
  };

  const closeModals = () => {
      setUserModal({ isOpen: false, user: null, mode: null });
      setLogModal({ isOpen: false, log: null });
      setStatusReason('');
  };

  const executeStatusChange = async (newStatus: AccountStatus) => {
      const targetUser = userModal.user;
      if (!user || !targetUser) return;
      
      // Validation for suspension/rejection
      if ((newStatus === AccountStatus.SUSPENDED || newStatus === AccountStatus.REJECTED) && !statusReason.trim()) {
          alert("Please provide a reason.");
          return;
      }
      
      setActionLoading(targetUser.id);
      
      try {
          await Api.updateUserStatus(user, targetUser.id, newStatus, statusReason);
          // Optimistic Update
          setAllUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, status: newStatus } : u));
          
          // Refresh logs
          const updatedStats = await Api.getStats(user);
          setStats(updatedStats);
          closeModals();
      } catch (e: any) {
          alert(`Failed: ${e.message}`);
      } finally {
          setActionLoading(null);
      }
  };

  // --- DATA PROCESSING ---

  // User Filtering & Sorting
  const processedUsers = useMemo(() => {
    let result = allUsers.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(userFilters.search.toLowerCase()) || 
                              u.email.toLowerCase().includes(userFilters.search.toLowerCase());
        const matchesRole = userFilters.role === 'all' || u.role === userFilters.role;
        const matchesStatus = userFilters.status === 'all' || u.status === userFilters.status;
        const matchesDept = userFilters.department === 'all' || u.department === userFilters.department;
        return matchesSearch && matchesRole && matchesStatus && matchesDept;
    });

    if (sortConfig !== null) {
        result.sort((a, b) => {
            const aVal = (a[sortConfig.key] || '').toString().toLowerCase();
            const bVal = (b[sortConfig.key] || '').toString().toLowerCase();
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return result;
  }, [allUsers, userFilters, sortConfig]);

  // Audit Log Filtering & Pagination
  const filteredLogs = useMemo(() => {
      if (!stats?.auditLogs) return [];
      return stats.auditLogs.filter((log: AuditLog) => {
          const matchesSearch = log.id.toLowerCase().includes(auditFilters.search.toLowerCase()) ||
                                log.details.toLowerCase().includes(auditFilters.search.toLowerCase()) ||
                                log.userId.toLowerCase().includes(auditFilters.search.toLowerCase());
          const matchesAction = auditFilters.action === 'all' || log.action === auditFilters.action;
          const matchesRole = auditFilters.role === 'all' || log.userRole === auditFilters.role;
          
          let matchesDate = true;
          const logDate = new Date(log.timestamp);
          if (auditFilters.dateFrom) matchesDate = matchesDate && logDate >= new Date(auditFilters.dateFrom);
          if (auditFilters.dateTo) {
             const endDate = new Date(auditFilters.dateTo);
             endDate.setHours(23, 59, 59);
             matchesDate = matchesDate && logDate <= endDate;
          }

          return matchesSearch && matchesAction && matchesRole && matchesDate;
      });
  }, [stats, auditFilters]);

  const paginatedLogs = useMemo(() => {
      const start = (logsPage - 1) * logsPerPage;
      return filteredLogs.slice(start, start + logsPerPage);
  }, [filteredLogs, logsPage, logsPerPage]);

  const totalLogPages = Math.ceil(filteredLogs.length / logsPerPage);

  // --- HELPERS ---

  const requestSort = (key: keyof User) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
      setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof User) => {
      if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-300 opacity-50" />;
      return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  const exportAuditLogs = () => {
      const headers = ['ID', 'Action', 'User ID', 'Role', 'Details', 'Timestamp'];
      const rows = filteredLogs.map((log: AuditLog) => [
          log.id,
          log.action,
          log.userId,
          log.userRole,
          `"${log.details.replace(/"/g, '""')}"`,
          new Date(log.timestamp).toISOString()
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const pendingFacultyCount = allUsers.filter(u => u.role === UserRole.FACULTY && u.status === AccountStatus.PENDING).length;

  if (loading || !stats) return <div className="p-10 text-center">Loading analytics...</div>;

  const chartData = stats.paperStats ? [
    { name: 'Submitted', count: stats.paperStats.submitted, color: '#3b82f6' },
    { name: 'Under Review', count: stats.paperStats.underReview, color: '#8b5cf6' },
    { name: 'Revisions', count: stats.paperStats.revision, color: '#eab308' },
    { name: 'Approved', count: stats.paperStats.approved, color: '#22c55e' },
    { name: 'Rejected', count: stats.paperStats.rejected, color: '#ef4444' },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative pb-20">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">System Administration</h1>
            <p className="text-slate-500 mt-1">Manage platform activity, users, and logs.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-1 flex">
              {['overview', 'users', 'audit'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                      {tab === 'users' ? 'User Management' : tab}
                  </button>
              ))}
          </div>
      </div>

      {/* --- TAB: OVERVIEW --- */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Quick Actions & Welcome */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                 <div className="lg:col-span-3 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg shadow-md p-6 text-white flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-500 overflow-hidden">
                            {user?.profileImage ? <img src={user.profileImage} alt="" className="h-full w-full object-cover" /> : <UserIcon className="h-8 w-8 text-slate-400" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Hello, {user?.name}</h2>
                            <p className="text-sm text-slate-300">System Administrator • {user?.department}</p>
                        </div>
                    </div>
                    <div className="hidden sm:block text-right">
                         <div className="text-3xl font-bold">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                         <div className="text-xs text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString()}</div>
                    </div>
                 </div>
                 
                 <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col justify-center space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Quick Actions</h3>
                    <button onClick={() => { setActiveTab('users'); setUserFilters(f => ({...f, role: UserRole.FACULTY, status: AccountStatus.PENDING})) }} className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm font-medium transition-colors">
                        <span>Review Faculty</span>
                        {pendingFacultyCount > 0 && <span className="bg-red-500 text-white text-xs px-1.5 rounded-full">{pendingFacultyCount}</span>}
                    </button>
                    <button onClick={() => { setActiveTab('audit'); }} className="w-full flex items-center px-3 py-2 bg-slate-50 text-slate-700 rounded hover:bg-slate-100 text-sm font-medium transition-colors">
                        <History className="w-4 h-4 mr-2" /> View Logs
                    </button>
                 </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KPICard icon={<Users />} label="Total Users" value={allUsers.length} color="blue" />
                <KPICard icon={<FileText />} label="Submissions" value={stats.total} color="indigo" />
                <KPICard icon={<Clock />} label="Pending Reviews" value={stats.paperStats?.underReview || 0} color="purple" />
                <KPICard icon={<AlertTriangle />} label="Pending Faculty" value={pendingFacultyCount} color="orange" highlight={pendingFacultyCount > 0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-6">Submission Status Distribution</h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#f1f5f9'}} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-[24rem]">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-900">Live Activity</h2>
                        <button onClick={() => setActiveTab('audit')} className="text-xs text-blue-600 hover:underline">View All</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-0">
                        {stats.auditLogs.slice(0, 8).map((log: AuditLog) => (
                            <div key={log.id} onClick={() => setLogModal({isOpen: true, log})} className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors flex items-start space-x-3 group">
                                <div className={`mt-1 p-1.5 rounded-full ${log.action.includes('STATUS') ? 'bg-orange-100 text-orange-600' : log.action.includes('SUBMIT') ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                    <Activity className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate group-hover:text-blue-600">{log.action.replace(/_/g, ' ')}</p>
                                    <p className="text-xs text-slate-500 truncate">{log.details}</p>
                                </div>
                                <div className="text-right whitespace-nowrap">
                                    <span className="text-[10px] text-slate-400 block">{new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                    <span className="text-[10px] font-bold text-slate-300">{log.userRole}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- TAB: USERS --- */}
      {activeTab === 'users' && (
        <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            
            {/* Filter Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        value={userFilters.search}
                        onChange={(e) => setUserFilters({...userFilters, search: e.target.value})}
                    />
                </div>
                <select 
                    className="border border-slate-300 rounded-md text-sm py-2 px-3"
                    value={userFilters.role}
                    onChange={(e) => setUserFilters({...userFilters, role: e.target.value})}
                >
                    <option value="all">All Roles</option>
                    {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select 
                    className="border border-slate-300 rounded-md text-sm py-2 px-3"
                    value={userFilters.status}
                    onChange={(e) => setUserFilters({...userFilters, status: e.target.value})}
                >
                    <option value="all">All Status</option>
                    {Object.values(AccountStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select 
                    className="border border-slate-300 rounded-md text-sm py-2 px-3"
                    value={userFilters.department}
                    onChange={(e) => setUserFilters({...userFilters, department: e.target.value})}
                >
                    <option value="all">All Departments</option>
                    {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto min-h-[400px]">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50" onClick={() => requestSort('name')}>
                                Name {getSortIcon('name')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50" onClick={() => requestSort('role')}>
                                Role {getSortIcon('role')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50" onClick={() => requestSort('department')}>
                                Department {getSortIcon('department')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50" onClick={() => requestSort('status')}>
                                Status {getSortIcon('status')}
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {processedUsers.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs mr-3">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">{u.name}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${u.role === UserRole.FACULTY ? 'bg-purple-100 text-purple-800' : 
                                          u.role === UserRole.ADMIN ? 'bg-slate-800 text-slate-200' : 'bg-blue-100 text-blue-800'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.department}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full items-center
                                        ${u.status === AccountStatus.ACTIVE ? 'bg-green-100 text-green-800' : 
                                          u.status === AccountStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : 
                                          u.status === AccountStatus.REJECTED ? 'bg-red-100 text-red-800 line-through' : 'bg-red-100 text-red-800'}`}>
                                        {u.status === AccountStatus.PENDING && <Clock className="w-3 h-3 mr-1" />}
                                        {u.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <button onClick={() => openUserModal(u, 'view')} className="text-slate-400 hover:text-blue-600 transition-colors" title="View Details">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        
                                        {/* Approval Workflow for Pending Faculty */}
                                        {u.status === AccountStatus.PENDING && (
                                            <>
                                                <button onClick={() => openUserModal(u, 'approve')} className="text-green-600 hover:text-green-800 transition-colors" title="Approve">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openUserModal(u, 'suspend')} className="text-red-500 hover:text-red-700 transition-colors" title="Reject">
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}

                                        {/* Status Toggle for Active/Suspended */}
                                        {u.status !== AccountStatus.PENDING && u.role !== UserRole.SUPER_ADMIN && user.id !== u.id && (
                                            <button 
                                                onClick={() => openUserModal(u, u.status === AccountStatus.ACTIVE ? 'suspend' : 'approve')} 
                                                className={`${u.status === AccountStatus.ACTIVE ? 'text-slate-400 hover:text-red-600' : 'text-slate-400 hover:text-green-600'} transition-colors`}
                                                title={u.status === AccountStatus.ACTIVE ? 'Suspend' : 'Activate'}
                                            >
                                                {u.status === AccountStatus.ACTIVE ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {processedUsers.length === 0 && <div className="p-8 text-center text-slate-500">No users found.</div>}
            </div>
        </div>
      )}

      {/* --- TAB: AUDIT LOGS --- */}
      {activeTab === 'audit' && (
        <div className="bg-white shadow rounded-lg border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Filter Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-2 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input 
                        type="text" 
                        placeholder="Search logs..." 
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        value={auditFilters.search}
                        onChange={(e) => setAuditFilters({...auditFilters, search: e.target.value})}
                    />
                </div>
                <select 
                    className="border border-slate-300 rounded-md text-sm py-2 px-3"
                    value={auditFilters.role}
                    onChange={(e) => setAuditFilters({...auditFilters, role: e.target.value})}
                >
                    <option value="all">All Roles</option>
                    {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="flex gap-2 lg:col-span-2">
                    <input type="date" className="w-full border border-slate-300 rounded-md text-sm py-2 px-3" value={auditFilters.dateFrom} onChange={e => setAuditFilters({...auditFilters, dateFrom: e.target.value})} />
                    <span className="self-center text-slate-400">-</span>
                    <input type="date" className="w-full border border-slate-300 rounded-md text-sm py-2 px-3" value={auditFilters.dateTo} onChange={e => setAuditFilters({...auditFilters, dateTo: e.target.value})} />
                </div>
                <button 
                    onClick={exportAuditLogs}
                    className="flex items-center justify-center px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" /> Export
                </button>
            </div>

            {/* Logs List */}
            <div className="divide-y divide-slate-200 min-h-[400px]">
                {paginatedLogs.map((log: AuditLog) => (
                    <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start space-x-4">
                         <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${log.action.includes('STATUS') ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                             <History className="w-4 h-4" />
                         </div>
                         <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-bold text-slate-900 uppercase">{log.action.replace(/_/g, ' ')}</h4>
                                <span className="text-xs text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                             </div>
                             <p className="text-sm text-slate-600">{log.details}</p>
                             <div className="mt-2 flex items-center text-xs text-slate-500 space-x-3">
                                <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Actor: {log.userRole}</span>
                                <span className="font-mono text-slate-400">ID: {log.id}</span>
                                <button onClick={() => setLogModal({isOpen: true, log})} className="text-blue-600 hover:underline">View Details</button>
                             </div>
                         </div>
                    </div>
                ))}
                {paginatedLogs.length === 0 && <div className="p-10 text-center text-slate-500">No logs found matching filters.</div>}
            </div>

            {/* Pagination */}
            {totalLogPages > 1 && (
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        Page {logsPage} of {totalLogPages}
                    </div>
                    <div className="flex space-x-2">
                        <button 
                            disabled={logsPage === 1}
                            onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                            className="p-2 border border-slate-300 rounded bg-white disabled:opacity-50 hover:bg-slate-100"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                            disabled={logsPage === totalLogPages}
                            onClick={() => setLogsPage(p => Math.min(totalLogPages, p + 1))}
                            className="p-2 border border-slate-300 rounded bg-white disabled:opacity-50 hover:bg-slate-100"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* User Modal */}
      {userModal.isOpen && userModal.user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-start mb-6">
                      <h3 className="text-xl font-bold text-slate-900">
                          {userModal.mode === 'view' ? 'User Details' : 
                           userModal.mode === 'suspend' ? (userModal.user.status === 'PENDING' ? 'Reject Application' : 'Suspend Account') : 
                           'Activate Account'}
                      </h3>
                      <button onClick={closeModals} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                  </div>
                  
                  {userModal.mode === 'view' ? (
                      <div className="space-y-4">
                          <div className="flex items-center space-x-4 mb-4">
                             <div className="h-16 w-16 bg-slate-200 rounded-full flex items-center justify-center text-2xl font-bold text-slate-500">
                                {userModal.user.name.charAt(0)}
                             </div>
                             <div>
                                <p className="text-lg font-bold">{userModal.user.name}</p>
                                <p className="text-slate-500">{userModal.user.email}</p>
                                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded bg-slate-100 text-slate-600`}>{userModal.user.role}</span>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                              <div><label className="text-xs text-slate-500 uppercase">Department</label><p>{userModal.user.department}</p></div>
                              <div><label className="text-xs text-slate-500 uppercase">Status</label><p>{userModal.user.status}</p></div>
                              <div><label className="text-xs text-slate-500 uppercase">Phone</label><p>{userModal.user.phoneNumber}</p></div>
                              <div><label className="text-xs text-slate-500 uppercase">Last Login</label><p>{userModal.user.lastLogin ? new Date(userModal.user.lastLogin).toLocaleString() : 'Never'}</p></div>
                              {userModal.user.role === UserRole.STUDENT && (
                                  <>
                                    <div><label className="text-xs text-slate-500 uppercase">Student ID</label><p>{userModal.user.studentId}</p></div>
                                    <div><label className="text-xs text-slate-500 uppercase">Program</label><p>{userModal.user.program}</p></div>
                                  </>
                              )}
                              {userModal.user.role === UserRole.FACULTY && (
                                  <>
                                    <div><label className="text-xs text-slate-500 uppercase">Employee ID</label><p>{userModal.user.employeeId}</p></div>
                                    <div><label className="text-xs text-slate-500 uppercase">Designation</label><p>{userModal.user.designation}</p></div>
                                  </>
                              )}
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          <div className={`p-4 rounded border ${userModal.mode === 'suspend' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                              <p className="text-sm font-medium">
                                  Are you sure you want to {userModal.mode === 'suspend' ? (userModal.user.status === 'PENDING' ? 'reject' : 'suspend') : 'approve/activate'} <strong>{userModal.user.name}</strong>?
                              </p>
                          </div>
                          
                          {(userModal.mode === 'suspend' || userModal.mode === 'approve') && (
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">
                                      {userModal.mode === 'suspend' ? 'Reason for Rejection/Suspension (Required)' : 'Note (Optional)'}
                                  </label>
                                  <textarea 
                                      className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                      rows={3}
                                      value={statusReason}
                                      onChange={(e) => setStatusReason(e.target.value)}
                                      placeholder={userModal.mode === 'suspend' ? "Violation of policy..." : "Approved after verification..."}
                                  />
                              </div>
                          )}
                          
                          <div className="flex justify-end space-x-3 pt-4">
                              <button onClick={closeModals} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50">Cancel</button>
                              <button 
                                  onClick={() => executeStatusChange(userModal.mode === 'suspend' ? (userModal.user!.status === 'PENDING' ? AccountStatus.REJECTED : AccountStatus.SUSPENDED) : AccountStatus.ACTIVE)}
                                  disabled={!!actionLoading}
                                  className={`px-4 py-2 rounded-md text-white font-medium ${userModal.mode === 'suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                              >
                                  {actionLoading ? 'Processing...' : 'Confirm Action'}
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Log Modal */}
      {logModal.isOpen && logModal.log && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                      <div>
                          <h3 className="text-lg font-bold text-slate-900">Audit Log Details</h3>
                          <p className="text-xs text-slate-500 font-mono mt-1">{logModal.log.id}</p>
                      </div>
                      <button onClick={closeModals} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-md border border-slate-200">
                          <div><label className="text-xs text-slate-500 uppercase font-bold">Timestamp</label><p className="text-sm">{new Date(logModal.log.timestamp).toLocaleString()}</p></div>
                          <div><label className="text-xs text-slate-500 uppercase font-bold">Action</label><p className="text-sm font-semibold">{logModal.log.action}</p></div>
                          <div><label className="text-xs text-slate-500 uppercase font-bold">Actor ID</label><p className="text-sm font-mono">{logModal.log.userId}</p></div>
                          <div><label className="text-xs text-slate-500 uppercase font-bold">Role</label><p className="text-sm">{logModal.log.userRole}</p></div>
                          {logModal.log.targetId && (
                              <div className="col-span-2 border-t border-slate-200 pt-2 mt-1">
                                  <label className="text-xs text-slate-500 uppercase font-bold">Target ID</label>
                                  <p className="text-sm font-mono">{logModal.log.targetId}</p>
                              </div>
                          )}
                      </div>

                      <div>
                          <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Description</label>
                          <div className="p-3 bg-white border border-slate-200 rounded text-sm text-slate-700">
                              {logModal.log.details}
                          </div>
                      </div>

                      {logModal.log.changes && logModal.log.changes.length > 0 && (
                          <div>
                              <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">State Changes</label>
                              <div className="border border-slate-200 rounded overflow-hidden">
                                  <table className="min-w-full divide-y divide-slate-200">
                                      <thead className="bg-slate-50">
                                          <tr>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Field</th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Old Value</th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">New Value</th>
                                          </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-slate-200 text-sm">
                                          {logModal.log.changes.map((change, idx) => (
                                              <tr key={idx}>
                                                  <td className="px-4 py-2 font-medium text-slate-700">{change.field}</td>
                                                  <td className="px-4 py-2 text-red-600 bg-red-50">{change.oldValue}</td>
                                                  <td className="px-4 py-2 text-green-600 bg-green-50">{change.newValue}</td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

const KPICard = ({ icon, label, value, color, highlight = false }: any) => {
    const colors: any = {
        blue: 'bg-blue-100 text-blue-600',
        indigo: 'bg-indigo-100 text-indigo-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600',
    };
    return (
        <div className={`bg-white p-6 rounded-lg shadow-sm border ${highlight ? 'border-orange-300 ring-2 ring-orange-100' : 'border-slate-200'} flex items-center`}>
            <div className={`p-3 rounded-full mr-4 ${colors[color]}`}>
                {React.cloneElement(icon, { className: "h-6 w-6" })}
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
};

export default AdminPanel;