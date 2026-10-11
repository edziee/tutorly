# Tutorly documents

Start here. Every document in the repo is listed below, with who it is for.

## Everyone reads these first

| Document | What it is |
| --- | --- |
| [`../README.md`](../README.md) | What the app is, what is built, how to run it |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Where each kind of file lives and the one rule: screens call `src/services`, never Firebase directly |
| [`PROJECT_PLAN.md`](PROJECT_PLAN.md) | The 3-week plan with the task tables. Update your task status here in the same pull request as your code |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | How we use branches, pull requests, mock data and secrets |

## Your member brief

Each brief lists your files, your tasks by week, what to watch out for and when you are done.

| You are | Open | Your main folders |
| --- | --- | --- |
| Member 1: Firebase, logins, security | [`members/MEMBER_1_FIREBASE_AND_AUTH.md`](members/MEMBER_1_FIREBASE_AND_AUTH.md) | `src/config`, `src/services/authService.js`, `userService.js`, `storageService.js`, `src/context`, `firebase-rules` |
| Member 2: Student features, booking, payment, geolocation | [`members/MEMBER_2_STUDENT_FEATURES.md`](members/MEMBER_2_STUDENT_FEATURES.md) | `src/services/tutorService.js`, `bookingService.js`, `locationService.js`, `src/utils`, `src/screens/student` |
| Member 3: Front end and UI | [`members/MEMBER_3_FRONT_END_UI.md`](members/MEMBER_3_FRONT_END_UI.md) | `src/theme`, `src/components`, `src/screens` (all), `src/navigation` |
| Member 4: Notifications, chat, admin | [`members/MEMBER_4_NOTIFICATIONS_CHAT_ADMIN.md`](members/MEMBER_4_NOTIFICATIONS_CHAT_ADMIN.md) | `src/services/chatService.js`, `notificationService.js`, `adminService.js`, `src/screens/admin` |

## Reference

| Document | What it is |
| --- | --- |
| [`FIRESTORE_SCHEMA.md`](FIRESTORE_SCHEMA.md) | Draft data structure for Firebase. Member 1 confirms it in Week 1. Change it only together with Member 1 |
| [`MOCK_DATA_INVENTORY.md`](MOCK_DATA_INVENTORY.md) | Every place that uses mock data, what replaces it and who owns it. Tick items off as you delete them |
| [`../.github/pull_request_template.md`](../.github/pull_request_template.md) | The checklist that appears when you open a pull request |

## Your first 10 minutes

```bash
git clone https://github.com/edziee/tutorly.git
cd tutorly
npm install
git checkout -b member1/firebase-setup     # use your own number and task
npm start
```

Then read your brief, pick the first task of Week 1, and work only in your files. Run `npm test` before you push if you touched `src/utils`.

When you finish: `git add .`, `git commit -m "short message"`, `git push -u origin <your-branch>`, open a pull request on GitHub and ask one teammate to review it.
