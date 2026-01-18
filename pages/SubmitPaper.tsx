import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Api } from '../services/api';
import { Department, PaperStatus, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FileText, Upload, Info, CheckCircle, X, ShieldCheck, Tag, Clock, Send, FileCheck } from 'lucide-react';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_MB, MOCK_SUPERVISORS } from '../constants';

const SubmitPaper: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    department: user?.department || Department.CS,
    supervisorName: '',
    abstract: '',
  });
  
  // Keyword Tags State
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  // File State
  const [file, setFile] = useState<File | null>(null);
  
  // Declaration State
  const [declaration, setDeclaration] = useState(false);

  if (user?.role !== UserRole.STUDENT) {
    return <div className="p-8 text-center text-red-600 font-bold border rounded m-8 bg-red-50">Access Denied: Student account required to access submission portal.</div>;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    if (!selectedFile) return;

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setError("Security Violation: Only PDF files are allowed.");
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds limit (${MAX_FILE_SIZE_MB}MB).`);
      return;
    }
    setFile(selectedFile);
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newKeyword = keywordInput.trim().replace(',', '');
      if (newKeyword && !keywords.includes(newKeyword) && keywords.length < 7) {
        setKeywords([...keywords, newKeyword]);
        setKeywordInput('');
      }
    }
  };

  const removeKeyword = (tagToRemove: string) => {
    setKeywords(keywords.filter(tag => tag !== tagToRemove));
  };

  const validateForm = () => {
    if (!formData.title.trim()) return "Paper Title is required.";
    if (!formData.supervisorName) return "Please select a Supervisor.";
    if (formData.abstract.length < 150) return `Abstract is too short (${formData.abstract.length}/150 characters).`;
    if (keywords.length === 0) return "Please add at least one keyword.";
    if (!file) return "Research manuscript (PDF) is required.";
    if (!declaration) return "You must accept the declaration.";
    return null;
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    setError(null);
    const validationError = validateForm();
    
    // Drafts can be partial, but for this strict system, we enforce basic integrity even for drafts
    // Exception: Drafts might skip the declaration check if we wanted, but let's keep it strict.
    if (validationError && !isDraft) {
      setError(validationError);
      return;
    }
    if (isDraft && (!formData.title || !file)) {
      setError("Drafts must at least have a Title and a File.");
      return;
    }

    setLoading(true);
    try {
      const status = isDraft ? PaperStatus.DRAFT : PaperStatus.SUBMITTED;
      await Api.submitPaper(
        user, 
        { 
          ...formData, 
          authors: [user.name], 
          keywords: keywords,
          status: status 
        }, 
        file!
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      
      {/* Workflow Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8 shadow-sm">
        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
            <Info className="h-5 w-5 mr-2 text-blue-600" />
            Submission & Review Workflow
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col">
                <div className="flex items-center mb-2">
                    <div className="bg-blue-100 p-1.5 rounded-full mr-2">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-semibold text-blue-800 text-sm">1. Auto-Check</span>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                    Immediate plagiarism scan upon submission. Similarity must be &lt; 15% to proceed.
                </p>
                <span className="text-xs font-medium text-slate-500 mt-2 flex items-center"><Clock className="w-3 h-3 mr-1"/> ~5 Mins</span>
            </div>
            
            <div className="flex flex-col">
                <div className="flex items-center mb-2">
                    <div className="bg-indigo-100 p-1.5 rounded-full mr-2">
                        <FileCheck className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="font-semibold text-indigo-800 text-sm">2. Faculty Review</span>
                </div>
                <p className="text-xs text-indigo-700 leading-relaxed">
                    Assigned supervisor reviews methodology and content.
                </p>
                <span className="text-xs font-medium text-slate-500 mt-2 flex items-center"><Clock className="w-3 h-3 mr-1"/> 3 - 5 Days</span>
            </div>

            <div className="flex flex-col">
                <div className="flex items-center mb-2">
                    <div className="bg-green-100 p-1.5 rounded-full mr-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-semibold text-green-800 text-sm">3. Final Decision</span>
                </div>
                <p className="text-xs text-green-700 leading-relaxed">
                    Outcome: <strong>Approved</strong>, <strong>Revision Requested</strong>, or <strong>Rejected</strong>.
                </p>
                <span className="text-xs font-medium text-slate-500 mt-2 flex items-center"><Send className="w-3 h-3 mr-1"/> Email Notification</span>
            </div>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Submit Research Paper</h1>
        <p className="text-slate-600 mt-2">
          Ensure all metadata is accurate. Revisions are only possible if requested by a reviewer.
        </p>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-slate-200">
        
        {error && (
          <div className="bg-red-50 border-b border-red-200 p-4 flex items-center">
            <AlertTriangle className="text-red-500 mr-2 flex-shrink-0" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="p-8 space-y-10">

          {/* SECTION 1: Paper Details */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-6 flex items-center">
              <span className="bg-slate-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">1</span>
              Paper Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Paper Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the full title of your research"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <input 
                  type="text" 
                  disabled 
                  value={user.department}
                  className="w-full bg-slate-100 border-slate-300 rounded-md shadow-sm text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">Locked to your registered department.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor <span className="text-red-500">*</span></label>
                <select
                  className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={formData.supervisorName}
                  onChange={e => setFormData({ ...formData, supervisorName: e.target.value })}
                >
                  <option value="">Select Supervisor...</option>
                  {MOCK_SUPERVISORS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Select the faculty member supervising this research.</p>
              </div>
            </div>
          </section>

          {/* SECTION 2: Research Description */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-6 flex items-center">
              <span className="bg-slate-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">2</span>
              Research Description
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Abstract <span className="text-red-500">*</span></label>
                <textarea
                  rows={6}
                  className={`w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${formData.abstract.length > 0 && formData.abstract.length < 150 ? 'border-red-300' : 'border-slate-300'}`}
                  placeholder="Briefly describe the research problem, methodology, and outcome..."
                  value={formData.abstract}
                  onChange={e => setFormData({ ...formData, abstract: e.target.value })}
                />
                <div className="flex justify-between mt-1">
                   <p className="text-xs text-slate-500">Minimum 150 characters required.</p>
                   <p className={`text-xs font-medium ${formData.abstract.length < 150 ? 'text-red-500' : 'text-green-600'}`}>
                     {formData.abstract.length} / 150
                   </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keywords <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {keywords.map((tag) => (
                    <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {tag}
                      <button type="button" onClick={() => removeKeyword(tag)} className="ml-1 text-blue-600 hover:text-blue-900 focus:outline-none">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Tag className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={keywords.length >= 7 ? "Max keywords reached" : "Type a keyword and press Enter..."}
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    disabled={keywords.length >= 7}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Maximum 7 keywords.</p>
              </div>
            </div>
          </section>

          {/* SECTION 3: Upload & Declaration */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-6 flex items-center">
              <span className="bg-slate-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">3</span>
              Upload & Declaration
            </h2>

            <div className="space-y-6">
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                {file ? (
                   <div className="flex flex-col items-center">
                     <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                     <p className="text-sm font-medium text-green-900">{file.name}</p>
                     <p className="text-xs text-green-700 mb-3">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready for upload</p>
                     <button 
                       type="button" 
                       onClick={() => setFile(null)}
                       className="text-xs text-red-600 hover:text-red-800 font-medium underline"
                     >
                       Remove and Replace
                     </button>
                   </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                    <div className="flex justify-center text-sm text-slate-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Upload Manuscript (PDF)</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf" />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">PDF only, up to 10MB.</p>
                  </>
                )}
              </div>
              
              {!file && (
                 <div className="bg-yellow-50 p-3 rounded-md flex items-start">
                   <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                   <p className="text-xs text-yellow-700">Warning: Once submitted, the original file cannot be overwritten. Revisions require a formal request from a reviewer.</p>
                 </div>
              )}

              <div className="flex items-start bg-slate-50 p-4 rounded-md border border-slate-200">
                <div className="flex items-center h-5">
                  <input
                    id="declaration"
                    type="checkbox"
                    checked={declaration}
                    onChange={(e) => setDeclaration(e.target.checked)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="declaration" className="font-medium text-slate-700">
                    I declare that this is my original work.
                  </label>
                  <p className="text-slate-500">
                    I confirm this submission adheres to the University's Plagiarism Policy and has been approved by my supervisor for submission.
                  </p>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="inline-flex justify-center items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="inline-flex justify-center items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SubmitPaper;