function getDateKey(offsetDays) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const mockSchedules = [
  {
    id: 'session-1',
    tutorName: 'Marcus Chen',
    subject: 'CS 240: Algorithms',
    dateKey: getDateKey(0),
    startTime: '4:00 PM',
    endTime: '7:00 PM',
    durationHours: 3,
    status: 'upcoming',
    location: 'Library Building 8',
    role: 'Alumni',
    rating: null,
    total: '₱250.00',
    paymentStatus: 'Escrow protected',
    notes: 'Bring your algorithm practice set and recursion questions.',
    image: null,
  },
  {
    id: 'session-2',
    tutorName: 'Dr. Francis Xavier',
    subject: 'CS 409: Mobile Computing',
    dateKey: getDateKey(1),
    startTime: '3:30 PM',
    endTime: '6:30 PM',
    durationHours: 3,
    status: 'upcoming',
    location: 'Campus Vault ID: #EV-3901',
    role: 'Faculty Tier',
    rating: null,
    total: '₱250.00',
    paymentStatus: 'Escrow protected',
    notes: 'Synchronous room opens 10 minutes before the session.',
    image: null,
  },
  {
    id: 'session-3',
    tutorName: 'Dr. Francis Xavier',
    subject: 'CS 301: Master Theorem and Recurrences',
    dateKey: getDateKey(-8),
    startTime: '3:30 PM',
    endTime: '5:30 PM',
    durationHours: 2,
    status: 'completed',
    location: 'Campus Library',
    role: 'Faculty Tier',
    rating: 'Clear explanations on dynamic programming',
    total: '₱250.00',
    paymentStatus: 'Released',
    notes: 'Review session focused on recurrence trees.',
    image: null,
  },
  {
    id: 'session-4',
    tutorName: 'Thomas Lin',
    subject: 'MATH 215: Multivariable Calculus',
    dateKey: getDateKey(-108),
    startTime: '3:30 PM',
    endTime: '6:30 PM',
    durationHours: 3,
    status: 'completed',
    location: 'Campus Study Hub',
    role: 'Peer Tutor',
    rating: 'Great visual explanations',
    total: '₱300.00',
    paymentStatus: 'Settled',
    notes: 'Archived session with shared canvas notes.',
    image: null,
  },
];