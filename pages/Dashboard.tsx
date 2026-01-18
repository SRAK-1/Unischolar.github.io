import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Api } from '../services/api';
import { Paper, UserRole, PaperStatus, Department } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { Plus, FileText, ChevronRight, Search, Filter, CheckCircle, Clock, AlertCircle, FileSearch, ArrowRight, Eye, Calendar } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          const [papersData, statsData] = await Promise.all([
            Api.getPapersForUser(user),
            Api.getStats(user)
          ]);
          setPapers(papersData);
          setStats(statsData);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [user]);

  if (!user) return null;

  // Filter Logic
  const filteredPapers = useMemo(() => {
    return papers.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                            p.uploaderName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesDept = deptFilter === 'all' || p.department === deptFilter;
      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [papers, search, statusFilter, deptFilter]);

  if (loading) return <div className="p-12 text-center text-slate-500">Loading dashboard...</div>;

  // --- FACULTY / REVIEWER DASHBOARD ---
  if (user.role === UserRole.FACULTY || user.role === UserRole.ADMIN) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reviewer Dashboard</h1>
            <p className="text-slate-600 mt-1">Manage assigned reviews and departmental submissions.</p>
          </div>
          {user.role === UserRole.ADMIN && (
             <Link to="/admin" className="text-sm text-blue-600 font-medium hover:underline flex items-center">
                Go to System Admin <ArrowRight className="w-4 h-4 ml-1" />
             </Link>
          )}
        </div>

        {/* Reviewer Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           <StatCard 
              label="Pending Reviews" 
              value={stats?.pending || 0} 
              icon={<Clock className="w-6 h-6 text-blue-600" />} 
              color="bg-blue-50 border-blue-200" 
           />
           <StatCard 
              label="Completed Reviews" 
              value={stats?.reviewed || 0} 
              icon={<CheckCircle className="w-6 h-6 text-green-600" />} 
              color="bg-green-50 border-green-200" 
           />
           <StatCard 
              label="My Students" 
              value={stats?.myStudents || 0} 
              icon={<UsersIcon className="w-6 h-6 text-purple-600" />} 
              color="bg-purple-50 border-purple-200" 
           />
           <StatCard 
              label="Avg Turnaround" 
              value="3 Days" 
              icon={<Calendar className="w-6 h-6 text-orange-600" />} 
              color="bg-orange-50 border-orange-200" 
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           
           {/* Main Content: Assigned Papers Table */}
           <div className="lg:col-span-3">
              <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center">
                          <FileSearch className="w-5 h-5 mr-2 text-slate-500" /> 
                          Assigned Papers
                      </h3>
                      
                      {/* Filters */}
                      <div className="flex flex-wrap gap-2">
                          <div className="relative">
                              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                              <input 
                                type="text" 
                                placeholder="Search title or student..." 
                                className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-xs focus:ring-blue-500 focus:border-blue-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                              />
                          </div>
                          <select 
                            className="border border-slate-300 rounded-md py-2 px-3 text-xs bg-white"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                          >
                              <option value="all">All Status</option>
                              {Object.values(PaperStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                          </select>
                      </div>
                  </div>

                  <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-white">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Paper Details</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                              {filteredPapers.length === 0 ? (
                                  <tr>
                                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm">
                                          No papers found matching your criteria.
                                      </td>
                                  </tr>
                              ) : (
                                  filteredPapers.map((paper) => (
                                      <tr key={paper.id} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-6 py-4">
                                              <div className="flex flex-col">
                                                  <Link to={`/paper/${paper.id}`} className="text-sm font-bold text-blue-600 hover:underline mb-1 line-clamp-1">
                                                      {paper.title}
                                                  </Link>
                                                  <span className="text-xs text-slate-500">
                                                      Student: <span className="font-medium text-slate-700">{paper.uploaderName}</span>
                                                  </span>
                                                  <span className="text-[10px] text-slate-400 mt-1">
                                                      Submitted: {new Date(paper.submissionDate).toLocaleDateString()}
                                                  </span>
                                              </div>
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                                              {paper.department}
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                              <StatusBadge status={paper.status} size="sm" />
                                          </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                              <Link 
                                                to={`/paper/${paper.id}`}
                                                className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                              >
                                                  <Eye className="w-3 h-3 mr-1.5" /> Review
                                              </Link>
                                          </td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
           </div>

           {/* Sidebar: Guidelines */}
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5">
                  <h4 className="font-bold text-indigo-900 mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2" /> Reviewer Guidelines
                  </h4>
                  <ul className="space-y-3 text-xs text-indigo-800">
                      <li className="flex items-start">
                          <span className="mr-2">•</span>
                          Check plagiarism report before reviewing content (must be &lt; 15%).
                      </li>
                      <li className="flex items-start">
                          <span className="mr-2">•</span>
                          Ensure formatting follows the University IEEE Standard.
                      </li>
                      <li className="flex items-start">
                          <span className="mr-2">•</span>
                          Provide constructive feedback for all "Revision Requested" actions.
                      </li>
                      <li className="flex items-start">
                          <span className="mr-2">•</span>
                          Approvals are final and trigger publication workflows.
                      </li>
                  </ul>
              </div>
           </div>

        </div>
      </div>
    );
  }

  // --- STUDENT DASHBOARD (Simple View) ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Submissions</h1>
          <p className="text-slate-600 mt-1">Track the status of your research papers.</p>
        </div>
        
        <Link to="/submit" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
          <Plus className="mr-2 h-4 w-4" />
          New Submission
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-slate-200">
        <ul className="divide-y divide-slate-200">
          {filteredPapers.length === 0 ? (
            <li className="p-12 text-center text-slate-500 flex flex-col items-center">
              <FileText className="h-12 w-12 text-slate-300 mb-3" />
              <p>No papers found.</p>
              {search && <button onClick={() => setSearch('')} className="text-blue-600 hover:underline mt-2 text-sm">Clear Search</button>}
            </li>
          ) : (
            filteredPapers.map((paper) => (
              <li key={paper.id}>
                <Link to={`/paper/${paper.id}`} className="block hover:bg-slate-50 transition-colors">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-blue-600 truncate max-w-lg">{paper.title}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <StatusBadge status={paper.status} size="sm" />
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-slate-500">
                          {paper.department}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0 sm:ml-6">
                           <Clock className="w-3.5 h-3.5 mr-1" />
                           Submitted: {new Date(paper.submissionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0">
                        <span className="mr-2">Version {paper.currentVersion}</span>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

// Helper for Icons
const UsersIcon = ({className}:{className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const StatCard = ({ label, value, icon, color }: any) => (
    <div className={`p-5 rounded-lg border flex items-center shadow-sm ${color} bg-opacity-30`}>
        <div className="mr-4 p-2 bg-white rounded-full shadow-sm">
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
    </div>
);

export default Dashboard;