import { mockTutors } from './mockTutors';

const [defaultTutor] = mockTutors;

export const mockMentorApplication = {
  tutor: defaultTutor,
  credentials: defaultTutor.credentials,
  preferredDays: ['Monday', 'Wednesday'],
  preferredTimeSlots: ['4:00 PM - 6:00 PM', '6:00 PM - 8:00 PM'],
  courses: [
    {
      id: 'course-1',
      code: 'CS 201',
      title: 'Data Structures & Algorithms',
      grade: '1.25',
      proof: 'CS201_TOR.pdf',
    },
    {
      id: 'course-2',
      code: 'MATH 110',
      title: 'Discrete Mathematics',
      grade: '1.00',
      proof: 'MATH110_TOR.jpg',
    },
  ],
  teachingPhilosophy:
    'I focus on breaking down abstract proofs and algorithmic complexities into bite-sized analogies and concrete everyday examples. In our sessions, we will construct step-by-step solutions together.',
};
