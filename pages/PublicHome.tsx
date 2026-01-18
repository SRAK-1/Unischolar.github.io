import React, { useEffect, useState } from 'react';
import { Api } from '../services/api';
import { Paper, Department, UserRole, PaperType } from '../types';
import { Search, Users, Download, Layers, Upload, X, BookOpen, Eye, ToggleLeft, ToggleRight, Calendar as CalendarIcon, ArrowRight, ArrowUpDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MOCK_SUPERVISORS } from '../constants';

const PublicHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<Paper[]>([]);
  
  // Filters State
  const [search, setSearch] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [exactMatch, setExactMatch] = useState(false);
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'oldest'>('relevance');
  
  // Advanced Date Filtering
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await Api.getPublicPapers();
      setPapers(data);
      setFilteredPapers(data);
      setLoading(false);
    };
    load();
  }, []);

  // Client-side filtering & Scoring
  useEffect(() => {
    let result = [...papers];

    // 1. Department Filter
    if (deptFilter !== 'All Departments') {
      result = result.filter(p => p.department === deptFilter);
    }

    // 2. Paper Type Filter
    if (typeFilter !== 'All Types') {
        result = result.filter(p => p.type === typeFilter);
    }

    // 3. Date Range Filter (Logical & Advanced)
    if (startDate || endDate) {
      result = result.filter(p => {
        const paperDate = new Date(p.submissionDate);
        // Normalize paper date to start of day for fair comparison
        paperDate.setHours(0, 0, 0, 0);

        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (paperDate < start) return false;
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the whole end day
            if (paperDate > end) return false;
        }

        return true;
      });
    }

    // 4. Author Filter
    if (authorFilter) {
      const authQ = authorFilter.toLowerCase();
      result = result.filter(p => p.authors.some(a => a.toLowerCase().includes(authQ)));
    }

    // 5. Search Logic
    const q = search.toLowerCase();
    if (search) {
      if (exactMatch) {
         // Exact word match using regex boundary
         const regex = new RegExp(`\\b${search}\\b`, 'i');
         result = result.filter(p => 
           regex.test(p.title) || 
           regex.test(p.abstract) || 
           p.keywords.some(k => regex.test(k))
         );
      } else {
         // General substring match
         result = result.filter(p => 
           p.title.toLowerCase().includes(q) || 
           p.abstract.toLowerCase().includes(q) ||
           p.authors.some(a => a.toLowerCase().includes(q)) ||
           p.keywords.some(k => k.toLowerCase().includes(q))
         );
      }
    }

    // 6. Sorting Logic
    if (sortBy === 'newest') {
        result.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
    } else if (sortBy === 'oldest') {
        result.sort((a, b) => new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime());
    } else {
        // Relevance (Default)
        if (search) {
            result.sort((a, b) => {
                const aTitleMatch = a.title.toLowerCase().includes(q);
                const bTitleMatch = b.title.toLowerCase().includes(q);
                
                if (aTitleMatch && !bTitleMatch) return -1;
                if (!aTitleMatch && bTitleMatch) return 1;
                return 0; 
            });
        } else {
            // Default to newest if no search query provided for relevance
            result.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
        }
    }

    setFilteredPapers(result);
  }, [papers, search, authorFilter, exactMatch, deptFilter, typeFilter, startDate, endDate, sortBy]);

  // Derived Accurate Stats
  const uniqueAuthors = new Set(papers.flatMap(p => p.authors)).size;
  const activeDepts = new Set(papers.map(p => p.department)).size;

  const handleSubmitClick = () => {
    if (user) {
      if (user.role === UserRole.STUDENT) {
        navigate('/submit');
      } else {
        navigate('/dashboard'); // Faculty/Admin go to dashboard
      }
    } else {
      navigate('/login');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setAuthorFilter('');
    setExactMatch(false);
    setDeptFilter('All Departments');
    setTypeFilter('All Types');
    setStartDate('');
    setEndDate('');
    setSortBy('relevance');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-12 pb-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          
          <div className="mb-10">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
                Dr. Bhimrao Ambedkar University, Agra
              </h1>
              <div className="space-y-2">
                <p className="text-sm md:text-base text-slate-300 font-medium max-w-4xl mx-auto leading-relaxed">
                  An Institution Of 90 Years of Glorious History & Contributions In Teaching And Research (Accreditated Grade A+ by NAAC)
                </p>
                
              </div>
          </div>

          <div className="flex justify-center">
             <button 
               onClick={handleSubmitClick}
               className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-lg flex items-center justify-center text-lg"
             >
               Submit Research <ArrowRight className="ml-2 h-5 w-5" />
             </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Section (Overlapping Hero) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {/* Card 1 */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center border-b-4 border-blue-500">
             <div className="text-4xl font-bold text-slate-800 mb-2">{papers.length}</div>
             <div className="text-sm text-slate-500 uppercase tracking-wide font-semibold">Research Papers</div>
          </div>
          {/* Card 2 */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center border-b-4 border-green-500">
             <div className="text-4xl font-bold text-slate-800 mb-2">{activeDepts}</div>
             <div className="text-sm text-slate-500 uppercase tracking-wide font-semibold">Active Departments</div>
          </div>
          {/* Card 3: Active Reviewers */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center border-b-4 border-purple-500">
             <div className="text-4xl font-bold text-slate-800 mb-2">{MOCK_SUPERVISORS.length}</div>
             <div className="text-sm text-slate-500 uppercase tracking-wide font-semibold">Active Reviewers</div>
          </div>
          {/* Card 4 */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center border-b-4 border-orange-500">
             <div className="text-4xl font-bold text-slate-800 mb-2">{uniqueAuthors}</div>
             <div className="text-sm text-slate-500 uppercase tracking-wide font-semibold">Active Researchers</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-300 mb-8">
           <button className="px-6 py-3 text-blue-600 border-b-2 border-blue-600 font-medium text-sm flex items-center">
             <Layers className="w-4 h-4 mr-2" /> Browse Papers
           </button>
           <button 
             onClick={handleSubmitClick}
             className="px-6 py-3 text-slate-500 hover:text-slate-700 font-medium text-sm flex items-center transition-colors"
           >
             <Upload className="w-4 h-4 mr-2" /> Upload Paper
           </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8">
           {/* Top Row: Search and Author */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
               <div className="relative">
                  <input
                    type="text"
                    className="block w-full pl-4 pr-10 py-3 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search by title or keyword..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button 
                      onClick={() => setSearch('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
               </div>
               <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Users className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-9 pr-4 py-3 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Filter by Author Name..."
                    value={authorFilter}
                    onChange={(e) => setAuthorFilter(e.target.value)}
                  />
               </div>
           </div>

           {/* Middle Row: Toggle */}
           <div className="flex items-center mb-4 space-x-2">
               <button 
                 onClick={() => setExactMatch(!exactMatch)}
                 className={`flex items-center text-sm ${exactMatch ? 'text-blue-600 font-medium' : 'text-slate-500'}`}
               >
                 {exactMatch ? <ToggleRight className="w-8 h-8 mr-1" /> : <ToggleLeft className="w-8 h-8 mr-1" />}
                 Exact keyword match
               </button>
           </div>
           
           {/* Filters Row */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Department Dropdown */}
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Department</label>
                <select
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="All Departments">All Departments</option>
                  {Object.values(Department).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

               {/* Paper Type Dropdown */}
               <div className="md:col-span-1">
                 <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Type</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BookOpen className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                    className="block w-full pl-9 px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    >
                    <option value="All Types">All Paper Types</option>
                    {Object.values(PaperType).map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                    </select>
                </div>
              </div>

               {/* Sort By Dropdown */}
               <div className="md:col-span-1">
                 <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Sort By</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ArrowUpDown className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                    className="block w-full pl-9 px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    >
                        <option value="relevance">Relevance</option>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                 </div>
               </div>

              {/* Date Range Inputs */}
              <div className="md:col-span-1 grid grid-cols-2 gap-2">
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
                  <div className="relative">
                      <input
                        type="date"
                        className="block w-full pl-8 px-2 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm"
                        value={startDate}
                        max={endDate} // Constraint: Start cannot be after End
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <CalendarIcon className="h-3 w-3 text-slate-400" />
                      </div>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
                  <div className="relative">
                      <input
                        type="date"
                        className="block w-full pl-8 px-2 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm"
                        value={endDate}
                        min={startDate} // Constraint: End cannot be before Start
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <CalendarIcon className="h-3 w-3 text-slate-400" />
                      </div>
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <div className="md:col-span-4 mt-2">
                  <button 
                    onClick={handleResetFilters}
                    className="w-full px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors text-sm font-medium"
                  >
                    Reset All Filters
                  </button>
              </div>
           </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
             <p>Loading research database...</p>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-dashed border-slate-300">
            <Search className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No papers found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {filteredPapers.map((paper) => (
              <Link key={paper.id} to={`/paper/${paper.id}`} className="group block h-full">
                <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border border-slate-200 p-6 h-full flex flex-col">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {paper.department}
                       </span>
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {paper.type}
                       </span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                        <div className="text-xs text-slate-500 flex items-center">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {new Date(paper.submissionDate).toLocaleDateString()}
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                      {paper.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-3">
                      {paper.abstract}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium truncate max-w-[50%]">{paper.authors.join(', ')}</span>
                    <div className="flex items-center space-x-3">
                        <span className="flex items-center text-slate-400" title="Views">
                            <Eye className="w-3.5 h-3.5 mr-1" /> {paper.viewCount || 0}
                        </span>
                        <span className="flex items-center text-slate-400" title="Downloads">
                            <Download className="w-3.5 h-3.5 mr-1" /> {paper.downloadCount}
                        </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicHome;