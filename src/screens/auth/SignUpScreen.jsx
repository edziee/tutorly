// Sign-up screen for students, tutors and professional tutors.
// Layout: Member 3.   Sign-up logic: Member 1 (authService.signUp).
// Plan tasks: "Build the UI for login and sign-up" (Member 3, Week 1) and
// "Build the professional tutor login logic ... with its verification
// documents" (Member 1, Week 2).
//
// Only the roles in SIGNUP_ROLES (src/constants/roles.js) can sign up here.
// Tutors and professional tutors also send verification documents, see
// storageService.uploadVerificationDocument.
import PlaceholderScreen from '../shared/PlaceholderScreen';

export default function SignUpScreen() {
  return <PlaceholderScreen title="Sign up" />;
}
