export function excludeCurrentUserTutor(tutors, userId) {
  if (!userId) return tutors;
  return tutors.filter((tutor) => tutor.uid !== userId);
}
