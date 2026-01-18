import { UserRole, PaperStatus, Department, User, AccountStatus, ReviewerRole, PaperType } from './types';

// Mock Users for Demo Access
export const MOCK_USERS: Record<string, User> = {
  student: {
    id: 'u_student_1',
    name: 'SHIV RAJ',
    email: 'shivraj2662@gmail.com',
    phoneNumber: '+91 97078193319',
    role: UserRole.STUDENT,
    department: Department.CS,
    status: AccountStatus.ACTIVE,
    studentId: 'STU654a62b689bcc1699373750',
    program: 'MCA',
    degreeLevel: 'Postgraduate',
    academicYear: '2024-2025',
    supervisorName: 'Dr. Robert Mentor',
    researchAreas: ['Cyber Security', 'Digital Forensics', 'IoT Security'],
    thesisTitle: 'Advanced Threat Detection in IoT Networks using Machine Learning',
    researchType: PaperType.THESIS,
    profileImage: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop'
  },
  faculty: {
    id: 'u_faculty_1',
    name: 'Dr. Robert Mentor',
    email: 'robert@gmail.com',
    phoneNumber: '+91 9876543211',
    role: UserRole.FACULTY,
    department: Department.CS,
    status: AccountStatus.ACTIVE,
    employeeId: 'FAC_CS_101',
    designation: 'Senior Professor',
    reviewerRole: ReviewerRole.SENIOR_REVIEWER,
    researchAreas: ['Distributed Systems', 'Cloud Computing', 'AI Ethics'],
    twoFactorEnabled: true
  },
  admin: {
    id: 'u_admin_1',
    name: 'System Administrator',
    // DEVELOPMENT ADMIN ACCOUNT
    email: 'bhartishivraj177@gmail.com',
    phoneNumber: '+91 9876543212',
    role: UserRole.ADMIN,
    status: AccountStatus.ACTIVE,
    department: Department.CS
  }
};

export const MOCK_SUPERVISORS = [
  "Dr. Robert Mentor",
  "Prof. Alan Turing",
  "Dr. Marie Curie",
  "Prof. Richard Feynman",
  "Dr. Jane Goodall",
  "Prof. Katherine Johnson",
  "Dr. Grace Hopper",
  "Prof. Stephen Hawking"
];

// Standard Research Areas for Dropdowns
export const RESEARCH_AREAS_LIST = [
  "Artificial Intelligence",
  "Machine Learning",
  "Cyber Security",
  "Cloud Computing",
  "IoT",
  "Data Science",
  "Blockchain",
  "Quantum Physics",
  "Molecular Biology",
  "Modern History",
  "Victorian Literature",
  "Applied Mathematics"
];

export const DEGREE_LEVELS = [
  "Undergraduate",
  "Postgraduate",
  "PhD"
];

// Mapping Departments to specific Courses/Programs
export const DEPARTMENT_PROGRAMS: Record<Department, string[]> = {
  [Department.CS]: ['B.Sc Computer Science', 'BCA', 'MCA', 'M.Tech CS', 'Ph.D Computer Science'],
  [Department.PHYSICS]: ['B.Sc Physics', 'M.Sc Physics', 'Ph.D Physics'],
  [Department.BIOLOGY]: ['B.Sc Biology', 'B.Sc Biotechnology', 'M.Sc Botany', 'M.Sc Zoology'],
  [Department.MATH]: ['B.Sc Mathematics', 'M.Sc Mathematics', 'Ph.D Mathematics'],
  [Department.HISTORY]: ['B.A. History', 'M.A. History', 'Ph.D History'],
  [Department.LITERATURE]: ['B.A. English', 'M.A. English', 'Ph.D Literature']
};

export const STATUS_COLORS: Record<PaperStatus, string> = {
  [PaperStatus.DRAFT]: 'bg-gray-100 text-gray-700 border-gray-200',
  [PaperStatus.SUBMITTED]: 'bg-blue-100 text-blue-700 border-blue-200',
  [PaperStatus.UNDER_REVIEW]: 'bg-purple-100 text-purple-700 border-purple-200',
  [PaperStatus.REVISION_REQUESTED]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [PaperStatus.APPROVED]: 'bg-green-100 text-green-700 border-green-200',
  [PaperStatus.REJECTED]: 'bg-red-100 text-red-700 border-red-200',
};

export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_FILE_TYPES = ['application/pdf'];

// Placeholder used for new uploads
export const MOCK_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';