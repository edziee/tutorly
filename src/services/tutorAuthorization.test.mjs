import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const rules = await readFile(
  new URL('../../firebase-rules/firestore.rules', import.meta.url),
  'utf8',
);

function ruleFunction(name) {
  const match = rules.match(
    new RegExp(`function ${name}\\([^)]*\\) \\{([\\s\\S]*?)\\n    \\}`),
  );
  assert.ok(match, `Expected Firestore rule function ${name}`);
  return match[1];
}

test('tutor operations require an approved private application and public profile', () => {
  const approvedTutor = ruleFunction('isApprovedTutor');
  assert.match(approvedTutor, /applicationPath\(uid\)/);
  assert.match(approvedTutor, /get\(applicationPath\(uid\)\)\.data\.get\('verificationStatus', ''\) == 'approved'/);
  assert.match(approvedTutor, /get\(tutorPath\(uid\)\)\.data\.get\('verificationStatus', ''\) == 'approved'/);
  assert.match(ruleFunction('isBookingTutor'), /isApprovedTutor\(request\.auth\.uid\)/);
  assert.match(ruleFunction('validBookingCreate'), /isApprovedTutor\(data\.tutorId\)/);
});

test('student applicants may write only their own pending application', () => {
  assert.match(ruleFunction('isTutorApplicationOwner'), /request\.auth\.uid == uid/);
  assert.match(ruleFunction('isTutorApplicationOwner'), /isStudent\(\) && tutorType in \['peer', 'professional'\]/);
  assert.match(ruleFunction('validTutorApplicationCreate'), /verificationStatus == 'pending'/);
  assert.match(ruleFunction('validTutorApplicationUpdate'), /resource\.data\.verificationStatus in \['pending', 'rejected'\]/);
});

test('application review is admin-only and self-review is denied', () => {
  for (const name of [
    'validAdminTutorReview',
    'validAdminApplicationCreate',
    'validAdminApplicationUpdate',
  ]) {
    const body = ruleFunction(name);
    assert.match(body, /isAdmin\(\)/);
    assert.match(body, /request\.auth\.uid != uid/);
  }
});

test('direct tutor signup status is pending and review is admin-only', async () => {
  const adminReview = ruleFunction('validAdminDirectTutorReview');
  assert.match(adminReview, /isAdmin\(\)/);
  assert.match(adminReview, /request\.auth\.uid != uid/);
  assert.match(adminReview, /resource\.data\.get\('role', ''\) == 'tutor'/);
  assert.match(adminReview, /resource\.data\.get\('tutorVerificationStatus', ''\) == 'pending'/);
  assert.match(adminReview, /request\.resource\.data\.tutorVerificationStatus in \['approved', 'rejected'\]/);
  assert.match(adminReview, /request\.resource\.data\.tutorVerificationNote\.size\(\) > 0/);
  assert.match(adminReview, /changes\.hasOnly/);
  assert.match(ruleFunction('validAccountCreate'), /tutorVerificationStatus == 'pending'/);
  assert.match(rules, /allow update: if validAdminDirectTutorReview\(uid\)/);
});

test('private application evidence is owner/admin-only and excluded from public profiles', () => {
  assert.match(
    rules,
    /match \/tutorApplications\/\{uid\} \{\s+allow get: if isAdmin\(\) \|\| \(signedIn\(\) && request\.auth\.uid == uid\);\s+allow list: if isAdmin\(\);/,
  );
  const publicProfile = ruleFunction('validPublicTutor');
  assert.match(publicProfile, /!\('courses' in data\)/);
  assert.match(publicProfile, /!\('applicationProofName' in data\)/);
  assert.match(publicProfile, /!\('applicationProofUrl' in data\)/);
  assert.match(publicProfile, /!\('paymentQrUrl' in data\)/);
});

test('token wallets are owner/admin-readable and only updated with an authorized ledger event', () => {
  assert.match(
    rules,
    /match \/wallets\/\{uid\} \{\s+allow get: if isAdmin\(\) \|\| \(signedIn\(\) && request\.auth\.uid == uid\);\s+allow list: if isAdmin\(\);\s+allow create: if validWalletInitialization\(uid\);\s+allow update: if validWalletUpdate\(uid\);\s+allow delete: if false;/,
  );
  const initialization = ruleFunction('validWalletInitialization');
  assert.match(initialization, /account\.get\('role', ''\) in \['student', 'tutor', 'professional'\]/);
  assert.match(initialization, /request\.resource\.data\.availableUnits == 0/);
  const update = ruleFunction('validWalletUpdate');
  assert.match(update, /validWalletEntry\(uid, transactionId\)/);
  assert.match(update, /entry\.type in \['admin_credit', 'admin_debit'\]/);
  assert.match(update, /isApprovedTutor\(request\.auth\.uid\)/);
});

test('token ledger is append-only and owner/admin-readable', () => {
  assert.match(
    rules,
    /match \/tokenTransactions\/\{transactionId\} \{\s+allow get, list: if isAdmin\(\) \|\|\s*\(signedIn\(\) && resource\.data\.accountId == request\.auth\.uid\);\s+allow create: if validTokenTransactionCreate\(transactionId\);\s+allow update, delete: if false;/,
  );
  assert.match(ruleFunction('validTokenTransactionCreate'), /validBookingAcceptanceEntry/);
  assert.match(ruleFunction('validTokenTransactionCreate'), /validBookingDepositHoldEntry/);
  assert.match(ruleFunction('validTokenTransactionCreate'), /validBookingRefundEntry/);
  assert.match(ruleFunction('validTokenTransactionCreate'), /validBookingDepositRefundEntry/);
  assert.match(ruleFunction('validTokenTransactionCreate'), /validBookingSettlementDebit/);
  assert.match(ruleFunction('validTokenTransactionCreate'), /validBookingSettlementCredit/);
});

test('booking prices are validated in whole minor units without direct float equality', () => {
  assert.match(ruleFunction('validTokenPrice'), /% 1/);
  assert.match(ruleFunction('tokenPriceMatchesUnits'), /scaledPrice >= units - 0\.000001/);
  assert.match(ruleFunction('validBookingCreate'), /tokenPriceMatchesUnits\(data\.totalAmount, data\.tokenAmountUnits\)/);
  assert.match(ruleFunction('validBookingCreate'), /data\.tokenStatus == 'pending'/);
  assert.match(ruleFunction('validBookingCreate'), /validBookingTokenSplit\(data\)/);
  assert.doesNotMatch(ruleFunction('validBookingCreate'), /validBookingReserveApplied/);
  assert.doesNotMatch(ruleFunction('validBookingCreate'), /data\.totalAmount \* 100 == data\.tokenAmountUnits/);
});

test('booking tokens move on acceptance, refund on cancellation, and settle on completion', async () => {
  const acceptance = ruleFunction('validBookingAcceptanceApplied');
  assert.match(acceptance, /studentBefore\.availableUnits - booking\.tokenAmountUnits/);
  assert.match(acceptance, /studentBefore\.heldUnits \+ remainingUnits/);
  assert.match(acceptance, /tutorBefore\.heldUnits \+ booking\.tokenDepositUnits/);
  assert.match(ruleFunction('validTutorResponse'), /validBookingAcceptanceApplied\(bookingId, data\)/);
  assert.match(ruleFunction('validBookingCancellation'), /data\.tokenStatus == 'not_charged'/);
  assert.match(ruleFunction('validBookingRefundApplied'), /booking\.tokenDepositUnits/);
  assert.match(ruleFunction('validBookingSettlementApplied'), /booking\.tokenDepositUnits/);

  const bookingService = await readFile(
    new URL('./bookingService.js', import.meta.url),
    'utf8',
  );
  const createBooking = bookingService.match(
    /export async function createBooking\([\s\S]*?export function subscribeToStudentBookings/,
  )?.[0];
  assert.ok(createBooking, 'Expected createBooking implementation');
  assert.match(createBooking, /TOKEN_BOOKING_STATUS\.PENDING/);
  assert.doesNotMatch(createBooking, /transaction\.get\(walletRef\)/);
  assert.doesNotMatch(createBooking, /TOKEN_TRANSACTION_TYPES\.BOOKING_RESERVE/);
});

test('manual wallet adjustments require an admin and reuse the same id on retries', async () => {
  const adminEntry = ruleFunction('validAdminWalletEntry');
  assert.match(adminEntry, /isAdmin\(\)/);
  assert.match(adminEntry, /entry\.type in \['admin_credit', 'admin_debit'\]/);
  assert.match(adminEntry, /entry\.availableDelta == entry\.amountUnits/);
  assert.match(adminEntry, /entry\.formReference\.size\(\) > 0/);
  const walletService = await readFile(
    new URL('./walletService.js', import.meta.url),
    'utf8',
  );
  const adminScreen = await readFile(
    new URL('../screens/admin/AdminWalletsScreen.jsx', import.meta.url),
    'utf8',
  );
  assert.match(walletService, /operationId/);
  assert.match(walletService, /prior\.accountId === targetUid/);
  assert.match(walletService, /prior\.formReference === cleanReference/);
  assert.match(walletService, /A Google Form or payment reference is required/);
  assert.doesNotMatch(walletService, /A reason is required for every wallet adjustment/);
  assert.match(adminScreen, /adjustmentOperation\?\.signature === signature/);
  assert.match(adminScreen, /label="Reason \(optional\)"/);
  assert.match(adminScreen, /label="Google Form \/ payment reference \(required\)"/);
});

test('wallet initialization preserves the signed-up role and never starts with value', async () => {
  const userService = await readFile(
    new URL('./userService.js', import.meta.url),
    'utf8',
  );
  assert.match(userService, /role: data\.role/);
  assert.match(userService, /availableUnits: 0,\s+heldUnits: 0/);
  assert.match(ruleFunction('validWalletInitialization'), /availableUnits == 0/);
  assert.match(ruleFunction('validWalletInitialization'), /heldUnits == 0/);
  assert.match(ruleFunction('validAccountCreate'), /request\.resource\.data\.role in \['student', 'tutor'\]/);
  const profileUpdate = ruleFunction('validProfileUpdate');
  const mutableFields = profileUpdate.match(/changes\.hasOnly\(\[([\s\S]*?)\]\)/);
  assert.ok(mutableFields, 'Expected an explicit allowlist for profile changes');
  assert.doesNotMatch(mutableFields[1], /'role'/);
});
