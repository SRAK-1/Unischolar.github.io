export enum UserRole {
  GUEST = 'GUEST',
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum AccountStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED'
}

export enum PaperStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum Department {
  CS = 'Computer Science',
  PHYSICS = 'Physics',
  BIOLOGY = 'Biology',
  MATH = 'Mathematics',
  HISTORY = 'History',
  LITERATURE = 'Literature'
}

export enum PaperType {
  THESIS = 'Thesis',
  DISSERTATION = 'Dissertation',
  JOURNAL_ARTICLE = 'Journal Article',
  CONFERENCE_PAPER = 'Conference Paper',
  CAPSTONE_PROJECT = 'Capstone Project',
  RESEARCH_PROPOSAL = 'Research Proposal'
}

export enum ReviewerRole {
  REVIEWER = 'Reviewer',
  SENIOR_REVIEWER = 'Senior Reviewer',
  COORDINATOR = 'Department Coordinator'
}

export interface User {
  // Identity (Read-Only after registration)
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  department?: Department;
  status: AccountStatus;
  lastLogin?: string; // ISO Date String
  
  // Student Specific Research Fields
  studentId?: string;
  program?: string; // e.g. MCA, B.Tech
  degreeLevel?: 'Undergraduate' | 'Postgraduate' | 'PhD';
  academicYear?: string; // e.g. 2024-2025
  supervisorName?: string; // Selected from approved list
  thesisTitle?: string;
  researchType?: PaperType;

  // Faculty Specific Research Fields
  employeeId?: string;
  designation?: string;
  reviewerRole?: ReviewerRole;

  // Shared Research Fields
  researchAreas?: string[]; // e.g. ["AI", "Cloud Computing"]
  
  // System Fields
  profileImage?: string;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'EMAIL' | 'SMS';
  notificationsEnabled?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  timestamp: string;
}

export interface PaperVersion {
  version: number;
  fileUrl: string;
  fileName: string;
  uploadDate: string;
}

export interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  department: Department;
  type: PaperType; 
  keywords: string[];
  uploaderId: string;
  uploaderName: string;
  supervisorName?: string;
  status: PaperStatus;
  versions: PaperVersion[];
  currentVersion: number;
  submissionDate: string;
  lastUpdated: string;
  comments: Comment[];
  reviewerId?: string; 
  plagiarismScore?: number; 
  downloadCount: number; 
  viewCount: number;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userRole: UserRole;
  targetId?: string;
  timestamp: string;
  details: string;
  changes?: { field: string; oldValue: string; newValue: string }[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  setSession: (user: User) => void;
}