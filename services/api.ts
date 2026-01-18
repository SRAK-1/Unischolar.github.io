import { Paper, User, PaperStatus, UserRole, AuditLog, Department, PaperVersion, AccountStatus, PaperType, ReviewerRole } from '../types';
import { MOCK_USERS, MOCK_PDF_URL, MAX_FILE_SIZE_MB, ALLOWED_FILE_TYPES } from '../constants';

// --- IN-MEMORY DATABASE ---

// Enhance mock users with default settings
const initializeUser = (user: User): User => ({
  ...user,
  twoFactorEnabled: user.twoFactorEnabled || false,
  twoFactorMethod: user.twoFactorMethod || 'EMAIL',
  notificationsEnabled: true,
  lastLogin: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString() // Random past date
});

const usersStore: User[] = [
  initializeUser({ ...MOCK_USERS.student }),
  initializeUser({ ...MOCK_USERS.faculty }),
  initializeUser({ ...MOCK_USERS.admin })
];

const credentialsStore: Record<string, string> = {
  'shivraj2662@gmail.com': 'password123',
  'robert@gmail.com': 'password123',
  'admin@gmail.com': 'admin123', // Legacy
  'bhartishivraj177@gmail.com': 'Admin@123' // Development Admin Credentials
};

interface OtpRecord {
  hashedCode: string; 
  expiresAt: number;
  attempts: number;
}
const otpStore: Record<string, OtpRecord> = {};

let papersStore: Paper[] = [
  {
    id: 'p_101',
    title: 'Optimizing Neural Networks for Low-Power Devices',
    abstract: 'This paper explores novel quantization techniques to reduce the computational footprint of convolutional neural networks without significant accuracy loss, specifically targeting IoT microcontrollers.',
    authors: ['Alice Scholar', 'John Doe'],
    department: Department.CS,
    type: PaperType.THESIS,
    keywords: ['AI', 'IoT', 'Optimization'],
    uploaderId: 'u_student_1',
    uploaderName: 'Alice Scholar',
    supervisorName: 'Dr. Robert Mentor',
    status: PaperStatus.UNDER_REVIEW,
    versions: [
      { version: 1, fileUrl: MOCK_PDF_URL, fileName: 'research_v1.pdf', uploadDate: new Date(Date.now() - 86400000 * 5).toISOString() }, // 5 days ago
      { version: 2, fileUrl: MOCK_PDF_URL, fileName: 'research_v2_final.pdf', uploadDate: new Date().toISOString() }
    ],
    currentVersion: 2,
    submissionDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    comments: [
       { id: 'c1', userId: 'u_faculty_1', userName: 'Dr. Robert Mentor', userRole: UserRole.FACULTY, content: 'Good progress, but check the citation format.', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
       { id: 'c2', userId: 'u_student_1', userName: 'Alice Scholar', userRole: UserRole.STUDENT, content: 'Updated as requested.', timestamp: new Date().toISOString() }
    ],
    reviewerId: 'u_faculty_1',
    plagiarismScore: 2,
    downloadCount: 124,
    viewCount: 350
  },
  {
    id: 'p_102',
    title: 'The Impact of Victorian Literature on Modern Society',
    abstract: 'A comprehensive analysis of how 19th-century literature influences contemporary social norms.',
    authors: ['Jane Smith'],
    department: Department.LITERATURE,
    type: PaperType.DISSERTATION,
    keywords: ['History', 'Literature', 'Society'],
    uploaderId: 'u_student_99',
    uploaderName: 'Jane Smith',
    status: PaperStatus.APPROVED,
    versions: [
      { version: 1, fileUrl: MOCK_PDF_URL, fileName: 'victorian_lit.pdf', uploadDate: '2023-11-15T10:00:00Z' }
    ],
    currentVersion: 1,
    submissionDate: '2023-11-15T10:00:00Z',
    lastUpdated: '2023-12-01T14:00:00Z',
    comments: [],
    plagiarismScore: 0,
    downloadCount: 450,
    viewCount: 1205
  }
];

let auditLogs: AuditLog[] = [
  {
    id: 'log_1',
    action: 'SYSTEM_INIT',
    userId: 'system',
    userRole: UserRole.ADMIN,
    timestamp: new Date().toISOString(),
    details: 'System initialized with seed data.'
  }
];

// --- SECURITY HELPERS ---

const simpleHash = (text: string) => `hashed_${text}_secure`;

const generateRandomOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const logAction = (user: User, action: string, details: string, targetId?: string, changes?: { field: string; oldValue: string; newValue: string }[]) => {
  const log: AuditLog = {
    id: `log_${Date.now()}`,
    action,
    userId: user.id,
    userRole: user.role,
    timestamp: new Date().toISOString(),
    details,
    targetId,
    changes
  };
  auditLogs = [log, ...auditLogs];
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// --- PUBLIC API METHODS ---

export const Api = {
  // 1. Authentication & Registration

  /**
   * Generates OTP.
   * Tries to call backend email server.
   * If backend is down, falls back to Alert/Console for Demo purposes.
   */
  sendOtp: async (contact: string, method: 'EMAIL' | 'MOBILE' | 'SMS'): Promise<void> => {
    // 1. Generate Secure Random OTP
    const otp = generateRandomOtp();
    
    // 2. Hash and Store internally for verification
    otpStore[contact] = {
      hashedCode: simpleHash(otp),
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0
    };

    // 3. Call Backend Server to Send Real Email
    if (method === 'EMAIL') {
        const payload = { email: contact, otp: otp };
        
        // Helper to try fetching
        const tryFetch = async (url: string) => {
          // Set a short timeout so we fallback quickly if server is dead
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout for snappier fallback

          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              throw new Error(errData.error || `Server Error: ${response.status}`);
            }
            return response;
          } catch (e) {
            clearTimeout(timeoutId);
            throw e;
          }
        };

        try {
            // Attempt 1: 127.0.0.1 (Preferred for local IPv4)
            await tryFetch('http://127.0.0.1:5000/api/send-otp');
        } catch (error: any) {
            // Silent retry on localhost
            try {
                // Attempt 2: localhost (Fallback for some systems)
                await tryFetch('http://localhost:5000/api/send-otp');
            } catch (finalError: any) {
                // --- GRACEFUL FALLBACK (SIMULATION MODE) ---
                console.log(`%c[SIMULATION MODE] Backend unavailable. OTP for ${contact}: ${otp}`, "color: #059669; font-weight: bold; background: #ecfdf5; padding: 4px;");
                
                // Wait a moment to simulate network request latency
                await delay(800);
                
                // Show a friendly Alert so the user knows what's happening
                alert(`[DEMO / OFFLINE MODE]\n\nBackend server is not connected.\n\nUse this OTP to proceed:\n👉 ${otp}`);
                
                // Return successfully so the app flow continues
                return; 
            }
        }
    } else {
        // SMS Fallback logic
        console.log(`[SMS] Sending ${otp} to ${contact}`);
        await delay(800);
        alert(`[SMS DEMO] OTP sent to ${contact}: ${otp}`);
    }
  },

  verifyOtp: async (contact: string, inputOtp: string): Promise<boolean> => {
    await delay(500);
    const record = otpStore[contact];

    if (!record) throw new Error("No verification request found. Please click 'Resend Code'.");
    if (Date.now() > record.expiresAt) {
      delete otpStore[contact];
      throw new Error("Code expired.");
    }
    if (record.attempts >= 5) {
      delete otpStore[contact];
      throw new Error("Too many failed attempts.");
    }

    const inputHash = simpleHash(inputOtp);
    if (inputHash === record.hashedCode) {
      delete otpStore[contact];
      return true;
    } else {
      record.attempts += 1;
      throw new Error(`Invalid code. ${5 - record.attempts} attempts remaining.`);
    }
  },

  resetPassword: async (email: string, otp: string, newPassword: string): Promise<void> => {
    await Api.verifyOtp(email, otp);
    const user = usersStore.find(u => u.email === email);
    if (!user) throw new Error("User not found.");
    credentialsStore[email] = newPassword;
    logAction(user, 'PASSWORD_RESET', 'User reset password via secure OTP flow.');
  },

  changePassword: async (user: User, currentPass: string, newPass: string): Promise<void> => {
    await delay(800);
    const storedPass = credentialsStore[user.email];
    if (storedPass !== currentPass) {
      throw new Error("The current password you entered is incorrect.");
    }
    if (currentPass === newPass) {
      throw new Error("New password must be different from the current password.");
    }
    
    // Update credentials
    credentialsStore[user.email] = newPass;
    logAction(user, 'PASSWORD_CHANGE', 'User changed their password via settings.');
  },

  register: async (data: any): Promise<User> => {
    await delay(800);
    if (!data.email.endsWith('@gmail.com')) throw new Error("Registration Restricted: @gmail.com only.");
    if (usersStore.find(u => u.email === data.email)) throw new Error("Account already exists.");

    let status = AccountStatus.ACTIVE;
    let reviewerRole = undefined;
    
    if (data.role === UserRole.FACULTY) {
      status = AccountStatus.PENDING;
      reviewerRole = ReviewerRole.REVIEWER; // Default starting role
    }
    
    if (data.role === UserRole.ADMIN || data.role === UserRole.SUPER_ADMIN) throw new AuthorizationError("Unauthorized role registration.");

    const newUser: User = {
        id: `u_${Date.now()}`,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        role: data.role,
        department: data.department,
        status: status,
        // Student specific
        studentId: data.studentId,
        program: data.program,
        degreeLevel: 'Undergraduate', // Default, user can update profile
        academicYear: new Date().getFullYear().toString(),
        
        // Faculty specific
        employeeId: data.employeeId,
        designation: data.designation,
        reviewerRole: reviewerRole,
        
        // Shared defaults
        researchAreas: [],
        twoFactorEnabled: false,
        twoFactorMethod: 'EMAIL',
        notificationsEnabled: true,
        lastLogin: undefined
    };

    usersStore.push(newUser);
    credentialsStore[data.email] = data.password;

    logAction(newUser, 'USER_REGISTER', `New user registered: ${newUser.email}`);
    return newUser;
  },

  login: async (email: string, pass: string): Promise<User> => {
    await delay(600);
    const storedPass = credentialsStore[email];
    if (!storedPass || storedPass !== pass) throw new Error("Invalid email or password.");
    
    const idx = usersStore.findIndex(u => u.email === email);
    if (idx === -1) throw new Error("User record not found.");
    
    const user = usersStore[idx];
    if (user.status === AccountStatus.PENDING) throw new AuthorizationError("Account Pending Approval.");
    if (user.status === AccountStatus.SUSPENDED) throw new AuthorizationError("Account Suspended.");
    if (user.status === AccountStatus.REJECTED) throw new AuthorizationError("Account application was rejected.");

    // Update Last Login
    usersStore[idx].lastLogin = new Date().toISOString();

    return usersStore[idx];
  },

  updateProfile: async (user: User, updates: Partial<User>): Promise<User> => {
    await delay(600);
    const idx = usersStore.findIndex(u => u.id === user.id);
    if (idx === -1) throw new Error("User not found");
    
    // In a real app we would validate fields, but here we trust the UI state for simplicity as requested
    const updatedUser = { ...usersStore[idx], ...updates };
    usersStore[idx] = updatedUser;
    
    logAction(updatedUser, 'PROFILE_UPDATE', 'User updated profile details');
    return updatedUser;
  },

  // Admin: Get all users
  getAllUsers: async (adminUser: User): Promise<User[]> => {
      await delay(300);
      if (adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN) {
          throw new AuthorizationError("Access Denied");
      }
      return [...usersStore];
  },

  // Admin: Suspend/Activate/Reject User
  updateUserStatus: async (adminUser: User, targetUserId: string, newStatus: AccountStatus, reason?: string): Promise<void> => {
      await delay(300);
      if (adminUser.role !== UserRole.ADMIN && adminUser.role !== UserRole.SUPER_ADMIN) {
        throw new AuthorizationError("Access Denied");
      }
      const idx = usersStore.findIndex(u => u.id === targetUserId);
      if (idx === -1) throw new Error("User not found");
      
      const oldStatus = usersStore[idx].status;
      usersStore[idx].status = newStatus;
      
      logAction(
        adminUser, 
        'USER_STATUS_CHANGE', 
        `Changed status for ${usersStore[idx].email}. Reason: ${reason || 'N/A'}`, 
        targetUserId,
        [{ field: 'Status', oldValue: oldStatus, newValue: newStatus }]
      );
  },

  // Faculty: Assign another reviewer
  assignReviewer: async (facultyUser: User, paperId: string, newReviewerId: string, note: string): Promise<Paper> => {
    await delay(500);
    if (facultyUser.role !== UserRole.FACULTY && facultyUser.role !== UserRole.ADMIN) {
         throw new AuthorizationError("Only Faculty can assign reviewers");
    }
    
    const idx = papersStore.findIndex(p => p.id === paperId);
    if (idx === -1) throw new Error("Paper not found");

    const reviewer = usersStore.find(u => u.id === newReviewerId);
    if (!reviewer) throw new Error("Reviewer not found");

    papersStore[idx].reviewerId = newReviewerId;
    
    // Add a system comment about the reassignment
    papersStore[idx].comments.push({
        id: `sys_${Date.now()}`,
        userId: facultyUser.id,
        userName: facultyUser.name,
        userRole: facultyUser.role,
        content: `[System] Reassigned reviewer to ${reviewer.name}. Note: ${note}`,
        timestamp: new Date().toISOString()
    });

    return papersStore[idx];
  },

  getPublicPapers: async (query: string = '', department?: string, type?: string): Promise<Paper[]> => {
    await delay(300);
    let results = papersStore.filter(p => p.status === PaperStatus.APPROVED);
    if (department && department !== 'All') results = results.filter(p => p.department === department);
    if (type && type !== 'All') results = results.filter(p => p.type === type);
    // Search logic moved to frontend for more complex filtering in this mock environment
    return results;
  },

  getPapersForUser: async (user: User): Promise<Paper[]> => {
    await delay(300);
    if (user.role === UserRole.STUDENT) return papersStore.filter(p => p.uploaderId === user.id);
    if (user.role === UserRole.FACULTY) return papersStore.filter(p => (p.reviewerId === user.id) || (p.department === user.department && p.status !== PaperStatus.DRAFT));
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) return papersStore;
    return [];
  },

  getPaperById: async (paperId: string, user: User | null): Promise<Paper | null> => {
    await delay(200);
    const idx = papersStore.findIndex(p => p.id === paperId);
    if (idx === -1) return null;
    
    // Increment View Count
    papersStore[idx].viewCount = (papersStore[idx].viewCount || 0) + 1;
    const paper = papersStore[idx];

    if (paper.status === PaperStatus.APPROVED) return paper; 
    if (!user) throw new AuthorizationError("Login required.");
    
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) return paper;
    if (user.role === UserRole.STUDENT && paper.uploaderId === user.id) return paper;
    if (user.role === UserRole.FACULTY && (paper.reviewerId === user.id || paper.department === user.department)) return paper;

    throw new AuthorizationError("Permission denied.");
  },

  incrementDownload: async (paperId: string): Promise<void> => {
    const idx = papersStore.findIndex(p => p.id === paperId);
    if (idx !== -1) {
        papersStore[idx].downloadCount = (papersStore[idx].downloadCount || 0) + 1;
    }
  },

  submitPaper: async (user: User, data: Partial<Paper>, file: File): Promise<Paper> => {
    await delay(800);
    
    // 1. STRICT Role Check
    if (user.role !== UserRole.STUDENT) {
      throw new Error("Access Denied: Only registered Students can submit papers.");
    }

    // 2. STRICT File Validation
    if (file.type !== 'application/pdf') {
      throw new Error("Invalid File: Only PDF documents are accepted.");
    }
    const maxSize = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File too large: Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`);
    }

    // 3. Metadata Sanitization & Validation
    const cleanTitle = (data.title || '').trim().replace(/[^a-zA-Z0-9\s:,-]/g, ''); // Remove special chars
    const cleanAbstract = (data.abstract || '').trim();
    
    if (cleanTitle.length < 5) throw new Error("Title must be at least 5 characters.");
    if (cleanAbstract.length < 50) throw new Error("Abstract must be at least 50 characters.");
    if (!data.supervisorName) throw new Error("Supervisor selection is required.");
    if (!data.keywords || data.keywords.length === 0) throw new Error("At least one keyword is required.");

    const newPaper: Paper = {
      id: `p_${Date.now()}`,
      title: cleanTitle,
      abstract: cleanAbstract,
      authors: [user.name], // Force author to be current user
      department: user.department || Department.CS, // Force department
      type: data.type || PaperType.THESIS,
      keywords: data.keywords,
      uploaderId: user.id,
      uploaderName: user.name,
      supervisorName: data.supervisorName,
      status: data.status || PaperStatus.SUBMITTED,
      versions: [{
        version: 1,
        fileUrl: MOCK_PDF_URL,
        fileName: file.name,
        uploadDate: new Date().toISOString()
      }],
      currentVersion: 1,
      submissionDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      comments: [],
      plagiarismScore: Math.floor(Math.random() * 20),
      downloadCount: 0,
      viewCount: 0
    };

    papersStore.push(newPaper);
    logAction(user, 'PAPER_SUBMIT', `Submitted: ${newPaper.title}`);
    return newPaper;
  },
  
  reviewPaper: async (user: User, paperId: string, decision: PaperStatus, comment: string): Promise<Paper> => {
      await delay(500);
      const idx = papersStore.findIndex(p => p.id === paperId);
      if (idx === -1) throw new Error("Paper not found");
      papersStore[idx].status = decision;
      papersStore[idx].comments.push({
          id: `c_${Date.now()}`, userId: user.id, userName: user.name, userRole: user.role, content: comment, timestamp: new Date().toISOString()
      });
      return papersStore[idx];
  },

  uploadRevision: async (user: User, paperId: string, file: File): Promise<Paper> => {
      await delay(500);
      const idx = papersStore.findIndex(p => p.id === paperId);
      if (idx === -1) throw new Error("Paper not found");
      papersStore[idx].currentVersion += 1;
      papersStore[idx].status = PaperStatus.SUBMITTED;
      papersStore[idx].versions.push({
          version: papersStore[idx].currentVersion, fileUrl: MOCK_PDF_URL, fileName: file.name, uploadDate: new Date().toISOString()
      });
      return papersStore[idx];
  },

  getStats: async (user: User) => {
    await delay(200);
    // Profile Dashboard Stats - accessible to everyone based on role
    if (user.role === UserRole.STUDENT) {
        return {
            total: papersStore.filter(p => p.uploaderId === user.id).length,
            approved: papersStore.filter(p => p.uploaderId === user.id && p.status === PaperStatus.APPROVED).length,
            pending: papersStore.filter(p => p.uploaderId === user.id && (p.status === PaperStatus.SUBMITTED || p.status === PaperStatus.UNDER_REVIEW)).length,
            revision: papersStore.filter(p => p.uploaderId === user.id && p.status === PaperStatus.REVISION_REQUESTED).length
        };
    }

    if (user.role === UserRole.FACULTY) {
        return {
             reviewed: papersStore.filter(p => p.reviewerId === user.id && p.status !== PaperStatus.SUBMITTED).length,
             pending: papersStore.filter(p => p.reviewerId === user.id && p.status === PaperStatus.SUBMITTED).length,
             myStudents: papersStore.filter(p => p.supervisorName === user.name).length
        };
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) throw new AuthorizationError("Admin only.");
    
    // Enhanced stats for Admin
    const paperStats = {
      submitted: papersStore.filter(p => p.status === PaperStatus.SUBMITTED).length,
      underReview: papersStore.filter(p => p.status === PaperStatus.UNDER_REVIEW).length,
      revision: papersStore.filter(p => p.status === PaperStatus.REVISION_REQUESTED).length,
      approved: papersStore.filter(p => p.status === PaperStatus.APPROVED).length,
      rejected: papersStore.filter(p => p.status === PaperStatus.REJECTED).length,
    };

    return {
      total: papersStore.length,
      ...paperStats,
      paperStats,
      pendingFaculty: usersStore.filter(u => u.role === UserRole.FACULTY && u.status === AccountStatus.PENDING).length,
      auditLogs: [...auditLogs]
    };
  }
};