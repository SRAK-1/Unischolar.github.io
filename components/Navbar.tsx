import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, User as UserIcon, Settings, ShieldCheck, LayoutDashboard, ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { UserRole } from '../types';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold tracking-tight">UniScholar</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                {/* Admin Only Link */}
                {isAdmin && (
                  <Link to="/admin" className={`flex items-center hover:text-blue-300 transition-colors ${location.pathname.includes('admin') ? 'text-blue-400' : ''}`}>
                    <ShieldCheck className="w-4 h-4 mr-1" /> Admin Panel
                  </Link>
                )}
              </>
            ) : null}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                
                {/* Profile Dropdown */}
                <div className="relative group z-50">
                    <button className="flex items-center text-right hover:bg-slate-800 p-2 rounded-lg transition-colors focus:outline-none">
                        <div className="mr-3 hidden sm:block">
                            <p className="text-sm font-medium leading-none group-hover:text-blue-300 transition-colors">{user?.name}</p>
                            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{user?.role}</p>
                        </div>
                        <div className="bg-slate-700 p-1.5 rounded-full overflow-hidden h-9 w-9 flex items-center justify-center border-2 border-transparent group-hover:border-blue-400 transition-all relative">
                            {user?.profileImage ? (
                                <img src={user.profileImage} alt="" className="h-full w-full object-cover rounded-full" />
                            ) : (
                                <UserIcon size={18} className="text-slate-300" />
                            )}
                        </div>
                        <ChevronDown className="w-4 h-4 ml-2 text-slate-400 group-hover:text-white transition-colors" />
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right border border-slate-100 translate-y-2 group-hover:translate-y-0">
                        
                        <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                            <p className="text-xs text-gray-500">{user?.role}</p>
                        </div>

                        <div className="px-2 py-1">
                            <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md flex items-center transition-colors">
                                <LayoutDashboard className="w-4 h-4 mr-3 text-slate-400" /> Dashboard
                            </Link>

                            {isAdmin && (
                              <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md flex items-center transition-colors">
                                  <ShieldCheck className="w-4 h-4 mr-3 text-slate-400" /> Admin Panel
                              </Link>
                            )}
                            
                            <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md flex items-center transition-colors">
                                <Settings className="w-4 h-4 mr-3 text-slate-400" /> My Profile
                            </Link>
                        </div>
                        
                        <div className="border-t border-gray-100 my-1"></div>
                        
                        <div className="px-2 py-1">
                            <button 
                                onClick={() => logout()}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md flex items-center transition-colors"
                            >
                                <LogOut className="w-4 h-4 mr-3" /> Logout
                            </button>
                        </div>
                    </div>
                </div>

              </div>
            ) : (
              <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;