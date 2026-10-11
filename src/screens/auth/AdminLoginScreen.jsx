// Hidden admin login. Normal users must never see a link to this screen.
// Layout: Member 3 (designs it in Figma in Week 1).   Logic: Member 1
// (authService.signInAdmin).
// Plan task: "Build the hidden admin login (no public sign-up; admin accounts
// created by the team in Firebase)" (Member 1, Week 2).
//
// It is registered in AuthNavigator but not linked from the login screen.
// Member 3 and Member 1 agree on how the team reaches it, for example a
// long press on the logo. Hiding the screen is not security: the real
// protection is the role check in signInAdmin and the Firestore rules.
import PlaceholderScreen from '../shared/PlaceholderScreen';

export default function AdminLoginScreen() {
  return <PlaceholderScreen title="Admin login" />;
}
