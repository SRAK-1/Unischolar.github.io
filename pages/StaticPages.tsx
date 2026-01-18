import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText, Award, Shield, Download, Pin, Tag } from 'lucide-react';

export const PlaceholderPage: React.FC<{ title: string; content: string; icon?: React.ReactNode }> = ({ title, content, icon }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-8 border border-slate-200">
        <div className="flex items-center mb-6">
           <div className="p-3 bg-blue-100 rounded-full mr-4 text-blue-600">
              {icon || <FileText className="w-6 h-6" />}
           </div>
           <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        </div>
        <div className="prose max-w-none text-slate-600 space-y-4">
           {content.split('\n').map((paragraph, idx) => (
             <p key={idx}>{paragraph}</p>
           ))}
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-100">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
             <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export const ResearchGuidelines = () => (
  <PlaceholderPage 
    title="Research Guidelines" 
    icon={<BookOpen className="w-6 h-6" />}
    content={`
      1. Submission Standards: All manuscripts must be submitted in PDF format and adhere to the University's IEEE formatting guidelines.
      
      2. Plagiarism Policy: A plagiarism score of less than 15% is required for acceptance. All submissions are automatically scanned.
      
      3. Review Process: Papers undergo a double-blind peer review. Faculty reviewers assess methodology, clarity, and contribution to the field.
      
      4. Ethics Approval: Research involving human or animal subjects must have prior clearance from the Ethics Committee.
    `} 
  />
);

export const SuccessStories: React.FC = () => {
  const papers = [
    {
      title: "Advanced AI Applications in Healthcare",
      authors: "Dr. Rajesh Kumar, Prof. Priya Sharma",
      tags: ["Engineering", "2024", "Research"],
      desc: "This paper explores cutting-edge applications of artificial intelligence in healthcare diagnostics and treatment planning.",
      downloads: 342,
      topics: "AI, healthcare, machine learning"
    },
    {
      title: "Climate Change Impact on Agricultural Production",
      authors: "Prof. Amit Singh, Dr. Neha Verma",
      tags: ["Science", "2023", "Review"],
      desc: "A comprehensive literature review on the effects of climate change on agricultural productivity in India.",
      downloads: 156,
      topics: "climate change, agriculture, sustainability"
    },
    {
      title: "Blockchain Technology in Supply Chain Management",
      authors: "Dr. Vikas Patel",
      tags: ["Commerce", "2024", "Research"],
      desc: "Investigating the implementation of blockchain technology for transparent supply chain management.",
      downloads: 289,
      topics: "blockchain, supply chain, technology"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Success Stories
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
             Highlighting the most impactful research contributions from our university scholars that are shaping industries and society.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2">
          {papers.map((paper, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
              <h3 className="text-xl font-bold text-cyan-700 mb-2 leading-tight">
                {paper.title}
              </h3>
              <p className="text-sm text-slate-500 mb-4">{paper.authors}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {paper.tags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      idx === 0 ? 'bg-cyan-50 text-cyan-700 border-cyan-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-sm text-slate-600 mb-6 flex-grow leading-relaxed">
                {paper.desc}
              </p>

              <div className="mt-auto pt-4 border-t border-slate-50">
                 <div className="flex items-center justify-between text-xs text-slate-500 mb-5">
                    <span className="flex items-center font-medium text-slate-600">
                       <Download className="w-4 h-4 mr-1.5 text-red-500" /> {paper.downloads} downloads
                    </span>
                    <span className="flex items-center text-slate-500 truncate max-w-[55%]">
                       <Pin className="w-4 h-4 mr-1.5 text-red-500 flex-shrink-0" /> <span className="truncate">{paper.topics}</span>
                    </span>
                 </div>
                 
                 <div className="flex gap-4">
                    <button className="flex-1 bg-[#155e75] hover:bg-[#0e4f61] text-white text-sm font-bold py-2.5 rounded transition-colors shadow-sm">
                      Download
                    </button>
                    <button className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-bold py-2.5 rounded transition-colors shadow-sm">
                      Cite
                    </button>
                 </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <Link to="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors">
             <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export const ThesisTemplates = () => (
  <PlaceholderPage 
    title="Thesis Templates" 
    icon={<FileText className="w-6 h-6" />}
    content={`
      Download official templates for your submission:
      
      - Ph.D. Dissertation Template (LaTeX)
      - Master's Thesis Template (Word/Docx)
      - Research Proposal Format
      - Bibliography Style Guide
      
      (Downloads are simulated in this demo)
    `} 
  />
);

export const EthicsCourses = () => (
  <PlaceholderPage 
    title="Research Ethics Courses" 
    icon={<Shield className="w-6 h-6" />}
    content={`
      Mandatory training for all researchers.
      
      Course 101: Introduction to Academic Integrity
      Course 202: Data Privacy and Protection
      Course 303: Human Subject Research Protocols
      
      Please contact the administration office to enroll.
    `} 
  />
);