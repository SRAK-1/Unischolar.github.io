import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Api } from '../services/api';
import { Paper, PaperStatus, UserRole, User } from '../types';
import StatusBadge from '../components/StatusBadge';
import { Download, AlertCircle, CheckCircle, XCircle, Clock, ShieldAlert, Upload, Eye, Quote, GitCompare, UserPlus, X, Filter, Lock, FileText, Calendar, Tag, User as UserIcon } from 'lucide-react';
import { MOCK_SUPERVISORS } from '../constants';

const PaperDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Viewer State
  const [selectedVersion, setSelectedVersion] = useState<number>(1);
  const [currentFileUrl, setCurrentFileUrl] = useState<string>('');

  // Action State
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Re-upload State
  const [reuploadFile, setReuploadFile] = useState<File | null>(null);

  // Modals State
  const [showCitation, setShowCitation] = useState(false);
  const [showAssignReviewer, setShowAssignReviewer] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean; type: PaperStatus | null }>({ isOpen: false, type: null });

  // Assignment State
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');

  // Comment Filter State
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest'>('newest');
  const [commentFilterRole, setCommentFilterRole] = useState<string>('all');

  // Compare State
  const [compareV1, setCompareV1] = useState<number>(0);
  const [compareV2, setCompareV2] = useState<number>(0);

  useEffect(() => {
    if (id) {
      Api.getPaperById(id, user).then(p => {
        setPaper(p);
        if (p) {
           setSelectedVersion(p.currentVersion);
           setCurrentFileUrl(p.versions[p.versions.length - 1].fileUrl);
           setCompareV1(p.currentVersion);
           setCompareV2(p.currentVersion > 1 ? p.currentVersion - 1 : 1);
        }
      }).catch(err => {
        setError(err.message);
      }).finally(() => setLoading(false));
    }
  }, [id, user]);

  useEffect(() => {
    if (user && (user.role === UserRole.FACULTY || user.role === UserRole.ADMIN)) {
        Api.getAllUsers(user).then(setAllUsers).catch(() => {});
    }
  }, [user]);

  // Update URL when version changes
  const handleVersionClick = (versionNum: number, url: string) => {
      setSelectedVersion(versionNum);
      setCurrentFileUrl(url);
  };

  const initiateReviewAction = (decision: PaperStatus) => {
      setActionError(null);
      if (decision !== PaperStatus.APPROVED && reviewComment.trim().length < 10) {
          setActionError("For Rejection or Revision requests, you MUST provide a detailed comment explaining why (min 10 chars).");
          return;
      }
      setConfirmAction({ isOpen: true, type: decision });
  };

  const handleReviewConfirm = async () => {
    if (!paper || !user || !confirmAction.type) return;
    setConfirmAction({ isOpen: false, type: null }); // Close modal
    
    setActionLoading(true);
    try {
      const updated = await Api.reviewPaper(user, paper.id, confirmAction.type, reviewComment);
      setPaper(updated);
      setReviewComment('');
      setActionSuccess(`Paper successfully marked as ${confirmAction.type.replace('_', ' ')}.`);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevisionUpload = async () => {
    if (!paper || !user || !reuploadFile) return;
    setActionError(null);
    setActionSuccess(null);
    
    setActionLoading(true);
    try {
      const updated = await Api.uploadRevision(user, paper.id, reuploadFile);
      setPaper(updated);
      setReuploadFile(null);
      // Reset view to latest
      setSelectedVersion(updated.currentVersion);
      setCurrentFileUrl(updated.versions[updated.versions.length-1].fileUrl);
      setActionSuccess("Revision uploaded successfully.");
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = () => {
    if (!paper) return;
    Api.incrementDownload(paper.id);
    setPaper(prev => prev ? {...prev, downloadCount: prev.downloadCount + 1} : null);
  };

  const handleAssignReviewer = async () => {
     if (!paper || !user || !selectedReviewer) return;
     setActionLoading(true);
     try {
         const updated = await Api.assignReviewer(user, paper.id, selectedReviewer, assignmentNote);
         setPaper(updated);
         setShowAssignReviewer(false);
         setActionSuccess("Reviewer reassigned successfully.");
     } catch (err: any) {
         setActionError(err.message);
     } finally {
         setActionLoading(false);
     }
  };

  const getBibtex = () => {
     if (!paper) return '';
     const year = new Date(paper.submissionDate).getFullYear();
     const authorStr = paper.authors.join(' and ');
     return `@article{${paper.id},
  title={${paper.title}},
  author={${authorStr}},
  year={${year}},
  publisher={Agra University Repository}
}`;
  };

  const getAPA = () => {
      if (!paper) return '';
      const year = new Date(paper.submissionDate).getFullYear();
      return `${paper.authors.join(', ')}. (${year}). ${paper.title}. Agra University Repository.`;
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading paper details...</div>;
  if (error) return (
      <div className="max-w-4xl mx-auto mt-8 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
          <AlertCircle className="text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
      </div>
  );
  if (!paper) return <div className="p-8 text-center">Paper not found</div>;

  const isReviewer = user?.role === UserRole.FACULTY || user?.role === UserRole.ADMIN;
  const isOwner = user?.id === paper.uploaderId;
  const canReview = isReviewer && [PaperStatus.SUBMITTED, PaperStatus.UNDER_REVIEW, PaperStatus.REVISION_REQUESTED].includes(paper.status);
  const canReupload = isOwner && [PaperStatus.REVISION_REQUESTED, PaperStatus.DRAFT].includes(paper.status);
  const eligibleReviewers = allUsers.filter(u => u.role === UserRole.FACULTY && u.id !== user?.id);

  // Access Control for Downloads
  const canDownload = user && (
     user.role === UserRole.ADMIN || 
     user.role === UserRole.SUPER_ADMIN || 
     user.role === UserRole.FACULTY || 
     user.id === paper.uploaderId
  );

  // Filter & Sort Comments
  const filteredComments = paper.comments
     .filter(c => commentFilterRole === 'all' || c.userRole === commentFilterRole)
     .sort((a, b) => {
         const dateA = new Date(a.timestamp).getTime();
         const dateB = new Date(b.timestamp).getTime();
         return commentSort === 'newest' ? dateB - dateA : dateA - dateB;
     });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      
      {/* Header Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6 border border-slate-200">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {paper.department}
              </span>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {paper.type}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 leading-tight mb-2">{paper.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-2">
                <span className="flex items-center"><UserIcon className="w-4 h-4 mr-1"/> {paper.uploaderName}</span>
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> Submitted: {new Date(paper.submissionDate).toLocaleDateString()}</span>
                <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> Updated: {new Date(paper.lastUpdated).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-3">
             <StatusBadge status={paper.status} />
             {paper.supervisorName && (
                 <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 font-medium">
                     Supervisor: {paper.supervisorName}
                 </span>
             )}
          </div>
        </div>
        
        {/* Actions & Metrics Bar */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-wrap gap-4 text-sm items-center justify-between">
           <div className="flex flex-wrap gap-6 items-center">
                <div className="flex items-center text-slate-700 bg-white px-3 py-1 rounded border border-slate-200 shadow-sm">
                    <ShieldAlert className={`w-4 h-4 mr-2 ${paper.plagiarismScore! > 15 ? 'text-red-500' : 'text-green-500'}`} />
                    Plagiarism Score: <span className={`font-bold ml-1 ${paper.plagiarismScore! > 15 ? 'text-red-600' : 'text-green-600'}`}>{paper.plagiarismScore}%</span>
                </div>
                <div className="flex gap-2">
                    {paper.keywords.map(k => (
                        <span key={k} className="flex items-center text-xs text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                            <Tag className="w-3 h-3 mr-1 opacity-50"/> {k}
                        </span>
                    ))}
                </div>
           </div>
           
           <div className="flex space-x-3">
                <button onClick={() => setShowCitation(true)} className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors">
                   <Quote className="w-3 h-3 mr-1.5" /> Cite
                </button>
                <button onClick={() => setShowCompare(true)} className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors">
                   <GitCompare className="w-3 h-3 mr-1.5" /> Compare Versions
                </button>
                {isReviewer && (
                    <button onClick={() => setShowAssignReviewer(true)} className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors">
                        <UserPlus className="w-3 h-3 mr-1.5" /> Reassign
                    </button>
                )}
           </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Abstract</h3>
          <p className="text-slate-700 leading-relaxed text-sm text-justify">{paper.abstract}</p>
        </div>
      </div>

      {/* Messages */}
      {(actionError || actionSuccess) && (
        <div className={`mb-6 p-4 rounded-md flex items-center shadow-sm ${actionError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {actionError ? <AlertCircle className="w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
            <span className="text-sm font-medium">{actionError || actionSuccess}</span>
        </div>
      )}

      {/* PDF PREVIEWER */}
      <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg mb-8 border border-slate-700">
          <div className="px-4 py-3 bg-slate-900 flex justify-between items-center border-b border-slate-700 text-white">
              <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-blue-400" />
                  <span className="text-sm font-medium">Document Preview: Version {selectedVersion}</span>
              </div>
              <div className="flex items-center space-x-3">
                  {canDownload ? (
                      <a 
                          href={currentFileUrl} 
                          onClick={handleDownload}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold transition-colors"
                      >
                          <Download className="w-3 h-3 mr-1.5" /> Download PDF
                      </a>
                  ) : (
                      <span className="flex items-center text-xs text-slate-400"><Lock className="w-3 h-3 mr-1" /> Protected</span>
                  )}
              </div>
          </div>
          <div className="bg-slate-100 h-[600px] flex items-center justify-center relative">
              {/* Iframe for PDF */}
              <iframe 
                  src={`${currentFileUrl}#toolbar=0&navpanes=0`} 
                  className="w-full h-full"
                  title="PDF Preview"
              />
              {/* Fallback overlay if mock URL doesn't load visually (mock logic) */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 hover:opacity-100 bg-black/5 transition-opacity">
                  <span className="text-slate-500 font-bold">Interactive Preview</span>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column: Review Actions & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Action Panel for Faculty */}
          {canReview && (
            <div className="bg-white shadow sm:rounded-lg border-2 border-indigo-100 p-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
               <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                 <CheckCircle className="w-5 h-5 mr-2 text-indigo-600" />
                 Review Decision
               </h3>
               <div className="bg-slate-50 p-4 rounded-md mb-4 border border-slate-200">
                   <label className="block text-sm font-medium text-slate-700 mb-2">Reviewer Comments</label>
                   <textarea
                     className="w-full border border-slate-300 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                     rows={4}
                     placeholder="Provide feedback here. Required for Revisions and Rejections."
                     value={reviewComment}
                     onChange={(e) => setReviewComment(e.target.value)}
                   />
               </div>
               <div className="flex flex-col sm:flex-row gap-3">
                 <button 
                   onClick={() => initiateReviewAction(PaperStatus.APPROVED)}
                   disabled={actionLoading}
                   className="flex-1 bg-green-600 text-white py-2.5 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium shadow-sm transition-colors"
                 >
                   Approve Paper
                 </button>
                 <button 
                   onClick={() => initiateReviewAction(PaperStatus.REVISION_REQUESTED)}
                   disabled={actionLoading}
                   className="flex-1 bg-yellow-500 text-white py-2.5 px-4 rounded-md hover:bg-yellow-600 disabled:opacity-50 font-medium shadow-sm transition-colors"
                 >
                   Request Revision
                 </button>
                 <button 
                   onClick={() => initiateReviewAction(PaperStatus.REJECTED)}
                   disabled={actionLoading}
                   className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 font-medium shadow-sm transition-colors"
                 >
                   Reject
                 </button>
               </div>
            </div>
          )}

          {/* Action Panel for Student Re-upload */}
          {canReupload && (
            <div className="bg-white shadow sm:rounded-lg border border-blue-100 p-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                 <Upload className="w-5 h-5 mr-2 text-blue-600" />
                 Upload Revision
               </h3>
               <div className="space-y-4">
                 <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                     <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={(e) => setReuploadFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mx-auto"
                      />
                 </div>
                  <button 
                    onClick={handleRevisionUpload}
                    disabled={!reuploadFile || actionLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm"
                  >
                    Submit Revision
                  </button>
               </div>
            </div>
          )}

          {/* Review History */}
          <div className="bg-white shadow sm:rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Review Timeline</h3>
              <div className="flex gap-2">
                 <select 
                    value={commentFilterRole}
                    onChange={(e) => setCommentFilterRole(e.target.value)}
                    className="text-xs border-slate-300 rounded-md py-1 pl-2 pr-6 focus:ring-indigo-500"
                 >
                    <option value="all">All Roles</option>
                    <option value={UserRole.FACULTY}>Reviewers</option>
                    <option value={UserRole.STUDENT}>Authors</option>
                 </select>
              </div>
            </div>
            <ul className="divide-y divide-slate-200">
              {filteredComments.length === 0 ? (
                <li className="p-8 text-center text-slate-500 text-sm">No review comments yet.</li>
              ) : (
                filteredComments.map((comment) => (
                  <li key={comment.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${comment.userRole === UserRole.FACULTY ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                          <span className="text-xs font-bold">{comment.userName.charAt(0)}</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900">{comment.userName}</h3>
                          <p className="text-xs text-slate-400">{new Date(comment.timestamp).toLocaleString()}</p>
                        </div>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase mb-1">
                            {comment.userRole}
                        </span>
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
                            {comment.content}
                        </p>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Sidebar Column: Version History & Meta */}
        <div className="space-y-6">
           {/* Version History */}
           <div className="bg-white shadow sm:rounded-lg border border-slate-200 p-0 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Version History</h4>
              </div>
              <ul className="divide-y divide-slate-100">
                {paper.versions.map((ver, idx) => (
                  <li 
                    key={idx} 
                    onClick={() => handleVersionClick(ver.version, ver.fileUrl)}
                    className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors border-l-4 ${selectedVersion === ver.version ? 'border-blue-500 bg-blue-50/50' : 'border-transparent'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-bold ${selectedVersion === ver.version ? 'text-blue-700' : 'text-slate-700'}`}>
                            Version {ver.version}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(ver.uploadDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate flex items-center">
                        <FileText className="w-3 h-3 mr-1" /> {ver.fileName}
                    </p>
                  </li>
                ))}
              </ul>
           </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmAction.isOpen && confirmAction.type && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 transform scale-100">
                  <div className="mb-4">
                      <h3 className="text-lg font-bold text-slate-900">Confirm Decision</h3>
                      <p className="text-sm text-slate-600 mt-2">
                          Are you sure you want to mark this paper as <strong>{confirmAction.type.replace('_', ' ')}</strong>? 
                          {confirmAction.type === PaperStatus.APPROVED && " This action allows publication."}
                          {confirmAction.type === PaperStatus.REJECTED && " This stops the review process."}
                      </p>
                  </div>
                  <div className="flex justify-end space-x-3">
                      <button 
                          onClick={() => setConfirmAction({isOpen: false, type: null})}
                          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handleReviewConfirm}
                          className={`px-4 py-2 text-sm font-bold text-white rounded-md transition-colors shadow-sm ${
                              confirmAction.type === PaperStatus.APPROVED ? 'bg-green-600 hover:bg-green-700' : 
                              confirmAction.type === PaperStatus.REJECTED ? 'bg-red-600 hover:bg-red-700' : 
                              'bg-yellow-500 hover:bg-yellow-600'
                          }`}
                      >
                          Confirm {confirmAction.type.replace(/_/g, ' ')}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* OTHER MODALS (Citation, Assignment, Compare) */}
      {showCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Cite this Paper</h3>
                    <button onClick={() => setShowCitation(false)}><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">APA Format</label>
                        <div className="bg-slate-50 p-3 rounded border border-slate-200 text-sm mt-1 select-all">
                            {getAPA()}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">BibTeX</label>
                        <textarea readOnly className="w-full bg-slate-50 p-3 rounded border border-slate-200 text-sm mt-1 h-32 font-mono select-all" value={getBibtex()} />
                    </div>
                </div>
            </div>
        </div>
      )}

      {showAssignReviewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Assign Reviewer</h3>
                    <button onClick={() => setShowAssignReviewer(false)}><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Select Faculty Member</label>
                        <select 
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            value={selectedReviewer}
                            onChange={(e) => setSelectedReviewer(e.target.value)}
                        >
                            <option value="">Choose a reviewer...</option>
                            {eligibleReviewers.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700">Note (Optional)</label>
                         <textarea 
                            className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2"
                            rows={3}
                            placeholder="Reason for assignment..."
                            value={assignmentNote}
                            onChange={(e) => setAssignmentNote(e.target.value)}
                         />
                    </div>
                    <button 
                        onClick={handleAssignReviewer}
                        disabled={actionLoading || !selectedReviewer}
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {showCompare && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center">
                        <GitCompare className="w-5 h-5 mr-2" /> Compare Versions
                    </h3>
                    <button onClick={() => setShowCompare(false)}><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                <div className="flex space-x-4 mb-4 items-center justify-center bg-slate-50 p-4 rounded-md">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase block">Left Panel</span>
                        <select 
                            value={compareV1} 
                            onChange={(e) => setCompareV1(Number(e.target.value))}
                            className="border-slate-300 rounded text-sm"
                        >
                            {paper.versions.map(v => <option key={v.version} value={v.version}>Version {v.version}</option>)}
                        </select>
                    </div>
                    <div className="text-slate-400">vs</div>
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase block">Right Panel</span>
                        <select 
                            value={compareV2} 
                            onChange={(e) => setCompareV2(Number(e.target.value))}
                            className="border-slate-300 rounded text-sm"
                        >
                             {paper.versions.map(v => <option key={v.version} value={v.version}>Version {v.version}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4 border border-slate-200 rounded-lg overflow-hidden relative">
                     <div className="bg-slate-100 p-4 overflow-y-auto border-r border-slate-300 text-center">
                         <h4 className="font-bold mb-2">Version {compareV1}</h4>
                         <iframe src={paper.versions.find(v => v.version === compareV1)?.fileUrl} className="w-full h-full bg-white" title="v1"/>
                     </div>
                     <div className="bg-slate-100 p-4 overflow-y-auto text-center">
                         <h4 className="font-bold mb-2">Version {compareV2}</h4>
                         <iframe src={paper.versions.find(v => v.version === compareV2)?.fileUrl} className="w-full h-full bg-white" title="v2"/>
                     </div>
                </div>
            </div>
          </div>
      )}

    </div>
  );
};

export default PaperDetails;