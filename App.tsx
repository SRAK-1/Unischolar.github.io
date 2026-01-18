import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PublicHome from './pages/PublicHome';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import SubmitPaper from './pages/SubmitPaper';
import PaperDetails from './pages/PaperDetails';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import Chatbot from './components/Chatbot';
import { EthicsCourses, ResearchGuidelines, SuccessStories, ThesisTemplates } from './pages/StaticPages';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<PublicHome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/submit" element={<SubmitPaper />} />
              <Route path="/paper/:id" element={<PaperDetails />} />
              <Route path="/admin" element={<AdminPanel />} />
              {/* Development Admin Route Mapping */}
              <Route path="/admin/dashboard" element={<AdminPanel />} />
              
              {/* Static Page Routes for Footer Links */}
              <Route path="/guidelines" element={<ResearchGuidelines />} />
              <Route path="/success-stories" element={<SuccessStories />} />
              <Route path="/templates" element={<ThesisTemplates />} />
              <Route path="/ethics" element={<EthicsCourses />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <Chatbot />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;