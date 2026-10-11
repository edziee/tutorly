// Login screen for students, tutors and professional tutors.
// Layout: Member 3.   Login logic: Member 1 (authService.signIn).
// Plan tasks: "Build the UI for login and sign-up" (Member 3, Week 1) and
// "Sign-up and login logic for students and tutors" (Member 1, Week 1).
//
// Member 3 decides in Figma whether each role has its own login screen or one
// screen with a role choice. If it is one screen, pass the role with
// navigation.navigate(ROUTES.LOGIN, { role }) and read route.params.role.
import PlaceholderScreen from '../shared/PlaceholderScreen';

export default function LoginScreen() {
  return <PlaceholderScreen title="Login" />;
}
