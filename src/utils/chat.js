export function getConversationCounterparty(chat, userId) {
  if (userId === chat.studentId) {
    const tutorTier = chat.tutorTier || 'Tutor';
    return {
      name: chat.tutorName || 'Tutor',
      role: tutorTier,
      category: tutorTier === 'Professor' ? 'Faculty / Profs' : 'Active Tutors',
    };
  }

  if (userId === chat.tutorId) {
    return {
      name: chat.studentName || 'Student',
      role: 'Student',
      category: 'Students',
    };
  }

  return {
    name: 'User',
    role: 'Member',
    category: 'All Messages',
  };
}
