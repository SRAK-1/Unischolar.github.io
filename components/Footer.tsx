import React from 'react';
import { Facebook, Twitter, Instagram, ArrowRight, Lock, ExternalLink, Volume2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const Footer: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleRestrictedLink = (e: React.MouseEvent, requiredRole?: UserRole) => {
    if (!user) {
      e.preventDefault();
      navigate('/login');
      return;
    }
    
    // If a specific role is required and user doesn't have it
    if (requiredRole && user.role !== requiredRole && user.role !== UserRole.ADMIN) {
        e.preventDefault();
        alert("Access Denied: You do not have permission to view this page.");
    }
  };

  const announcements = [
      "Research Grant Applications for 2024-25 open now",
      "Annual University Research Symposium: Call for Papers",
      "Updated Plagiarism Guidelines effective immediately",
      "Workshop on Academic Writing: Register by Friday",
      "New digital library access credentials sent to student emails",
      "Campus-wide Wi-Fi maintenance scheduled for Sunday",
      "Ph.D. Thesis Submission Deadline Extended to May 30"
  ];

  return (
    <footer className="bg-slate-50 border-t border-slate-200">
      
      <style>{`
        @keyframes vertical-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-vertical-scroll {
          animation: vertical-scroll 20s linear infinite;
        }
        .animate-vertical-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Announcements Marquee Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between bg-blue-50 border border-blue-100 rounded-lg p-4 overflow-hidden">
                <div className="flex items-center mb-4 md:mb-0 md:mr-6 z-10 bg-blue-50 pr-4">
                    <div className="p-2 bg-blue-600 rounded-full mr-3 text-white">
                        <Volume2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 whitespace-nowrap">Key Announcements For Students</h3>
                </div>
                
                <div className="flex-1 h-12 overflow-hidden relative w-full">
                    {/* Continuous Scrolling Container */}
                    <div className="absolute top-0 left-0 w-full animate-vertical-scroll">
                        <div className="flex flex-col space-y-2">
                             {/* Original Set */}
                             {announcements.map((text, i) => (
                                 <div key={`a-${i}`} className="text-sm font-medium text-slate-700 flex items-center justify-center md:justify-start h-10">
                                     • {text}
                                 </div>
                             ))}
                             {/* Duplicate Set for Loop */}
                             {announcements.map((text, i) => (
                                 <div key={`b-${i}`} className="text-sm font-medium text-slate-700 flex items-center justify-center md:justify-start h-10">
                                     • {text}
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="bg-blue-600 text-white py-12">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               
               {/* Student Section */}
               <div>
                  <h4 className="text-lg font-bold mb-4">Student Section</h4>
                  <ul className="space-y-2 text-sm text-blue-100">
                     <li>
                        <Link to="/register?role=student" className="hover:text-white hover:underline block">Student Registration</Link>
                     </li>
                     <li>
                        <Link to="/login" className="hover:text-white hover:underline block">Student Login</Link>
                     </li>
                     <li>
                        <Link to="/guidelines" className="hover:text-white hover:underline block">Research Guidelines</Link>
                     </li>
                     <li>
                        <Link to="/success-stories" className="hover:text-white hover:underline block">Success Stories</Link>
                     </li>
                     <li>
                        <Link to="/templates" className="hover:text-white hover:underline block">Thesis Templates</Link>
                     </li>
                     <li>
                        <Link to="/ethics" className="hover:text-white hover:underline block">Ethics Courses</Link>
                     </li>
                  </ul>
               </div>

               {/* Faculty/Research Section */}
               <div>
                  <h4 className="text-lg font-bold mb-4">Faculty & Research</h4>
                  <ul className="space-y-2 text-sm text-blue-100">
                     <li>
                        <Link to="/register?role=faculty" className="hover:text-white hover:underline block">Faculty Registration</Link>
                     </li>
                     <li>
                        <Link to="/login" className="hover:text-white hover:underline block">Reviewer Login</Link>
                     </li>
                     <li>
                        <Link 
                           to="/dashboard" 
                           onClick={(e) => handleRestrictedLink(e, UserRole.FACULTY)}
                           className="hover:text-white hover:underline flex items-center"
                        >
                           Submit Review {(!user || user.role === UserRole.STUDENT) && <Lock className="w-3 h-3 ml-1 opacity-70" />}
                        </Link>
                     </li>
                     <li>
                        <Link 
                           to="/admin" 
                           onClick={(e) => handleRestrictedLink(e, UserRole.ADMIN)}
                           className="hover:text-white hover:underline flex items-center"
                        >
                           Dept. Analytics {(!user || user.role !== UserRole.ADMIN) && <Lock className="w-3 h-3 ml-1 opacity-70" />}
                        </Link>
                     </li>
                     <li>
                        <Link 
                           to="/admin"
                           onClick={(e) => handleRestrictedLink(e, UserRole.ADMIN)} 
                           className="hover:text-white hover:underline block"
                        >
                            Grant Management
                        </Link>
                     </li>
                  </ul>
               </div>

               {/* Resources */}
               <div>
                  <h4 className="text-lg font-bold mb-4">Useful Resources</h4>
                  <ul className="space-y-2 text-sm text-blue-100">
                     <li>
                        <a href="https://www.education.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline flex items-center">
                            Ministry of Education <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                        </a>
                     </li>
                     <li>
                        <a href="https://www.ugc.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline flex items-center">
                            UGC Guidelines <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                        </a>
                     </li>
                     <li>
                        <a href="https://ndl.iitkgp.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline flex items-center">
                            National Digital Library <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                        </a>
                     </li>
                     <li>
                        <a href="https://shodhganga.inflibnet.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline flex items-center">
                            Shodhganga <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                        </a>
                     </li>
                     <li>
                        <a href="https://www.ncs.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline flex items-center">
                            National Career Service <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                        </a>
                     </li>
                  </ul>
               </div>

               {/* Contact & About */}
               <div>
                  <h4 className="text-lg font-bold mb-4">About Agra University</h4>
                  <div className="text-sm text-blue-100 space-y-4">
                     <p>A premier institution dedicated to academic excellence and cutting-edge research.</p>
                     
                     <div>
                        <h5 className="font-bold text-white mb-1">Have Questions?</h5>
                        <p>Agra University Campus,</p>
                        <p>Agra, Uttar Pradesh 282004</p>
                        <p>0562-28581423</p>
                        <p>research@agrauniversity.ac.in</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="mt-12 border-t border-blue-500 pt-8 flex flex-col md:flex-row justify-between items-center">
               <div className="flex space-x-6 mb-4 md:mb-0">
                  <a href="#" className="text-white hover:text-blue-200"><Facebook className="w-8 h-8" /></a>
                  <a href="#" className="text-white hover:text-blue-200"><Twitter className="w-8 h-8" /></a>
                  <a href="#" className="text-white hover:text-blue-200"><Instagram className="w-8 h-8" /></a>
               </div>
               
               <div className="text-sm text-blue-200 text-center md:text-right">
                  <p>Made with ♥ in India | From Students to Students</p>
                  <p>Copyright © 2026. Agra University Research Cell</p>
               </div>
            </div>
         </div>
      </div>
    </footer>
  );
};

export default Footer;