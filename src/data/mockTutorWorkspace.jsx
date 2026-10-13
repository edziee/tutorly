export const mockTutorStudents = [
  {
    id: 'student-1',
    name: 'Ari Mendoza',
    initials: 'AM',
    course: 'CS 240: Algorithms',
    preview: 'Thanks for the recursion notes!',
    time: '10:42 AM',
    status: 'Active',
    session: 'Session tomorrow · 4:00 PM',
    color: '#5C56A5',
  },
  {
    id: 'student-2',
    name: 'Bea Santos',
    initials: 'BS',
    course: 'MATH 215',
    preview: 'Can we review the practice set?',
    time: 'Yesterday',
    status: 'Active',
    session: 'Thu 3:00 PM · White Hall 304',
    color: '#1A8D80',
  },
  {
    id: 'student-3',
    name: 'Cal Reyes',
    initials: 'CR',
    course: 'SWE Mock Interview',
    preview: 'The rubric helped a lot. Thank you!',
    time: 'Oct 14',
    status: 'Completed',
    session: 'Completed · Oct 12',
    color: '#C56B4C',
  },
];

export const mockTutorSessions = [
  {
    id: 'tutor-session-1',
    studentName: 'Ari Mendoza',
    subject: 'CS 240: Algorithms',
    date: 'Today',
    time: '4:00 PM - 7:00 PM',
    location: 'Library Building 8',
    status: 'Upcoming',
    accent: '#1A8D80',
  },
  {
    id: 'tutor-session-2',
    studentName: 'Bea Santos',
    subject: 'MATH 215: Multivariable Calculus',
    date: 'Tomorrow',
    time: '3:30 PM - 6:30 PM',
    location: 'Campus Study Hub',
    status: 'Upcoming',
    accent: '#5C56A5',
  },
  {
    id: 'tutor-session-3',
    studentName: 'Cal Reyes',
    subject: 'SWE Mock Interview',
    date: 'Oct 12',
    time: '2:00 PM - 3:00 PM',
    location: 'Online session',
    status: 'Completed',
    accent: '#B78327',
  },
];

export const mockReviewedApplications = [
  { id: 'review-1', name: 'Mika Dela Cruz', type: 'Peer Tutor', course: 'CS 201', status: 'Approved', date: 'Oct 12' },
  { id: 'review-2', name: 'Dr. Paolo Reyes', type: 'Faculty', course: 'MATH 110', status: 'Approved', date: 'Oct 10' },
  { id: 'review-3', name: 'Jon Flores', type: 'Peer Tutor', course: 'IT 204', status: 'Rejected', date: 'Oct 08' },
];
