import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { requireAuth, requireFirebase } from '../config/firebase';
import { COLLECTIONS } from '../constants/collections';
import { ROLES } from '../constants/roles';
import { TOKEN_TRANSACTION_TYPES } from '../constants/statuses';
import { toTokenUnits } from '../utils/tokens';

const INITIAL_WALLET = {
  availableUnits: 0,
  heldUnits: 0,
};

async function requireAdmin(db, adminUid) {
  const authUid = requireAuth().currentUser?.uid;
  if (!authUid || authUid !== adminUid) {
    throw new Error('Sign in as the administrator managing this wallet.');
  }
  const admin = await getDoc(doc(db, COLLECTIONS.USERS, adminUid));
  if (!admin.exists() || admin.data().role !== ROLES.ADMIN) {
    throw new Error('Only an administrator can adjust token balances.');
  }
}

export async function ensureWallet(uid) {
  if (!uid) throw new Error('A signed-in account is required to open a wallet.');
  const authUid = requireAuth().currentUser?.uid;
  if (authUid !== uid) throw new Error('Only the signed-in account can initialize its wallet.');
  const { db } = requireFirebase();
  const walletRef = doc(db, COLLECTIONS.WALLETS, uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(walletRef);
    if (snapshot.exists()) return;
    transaction.set(walletRef, {
      ...INITIAL_WALLET,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

async function ensureWalletForAdmin(db, targetUid) {
  const walletRef = doc(db, COLLECTIONS.WALLETS, targetUid);
  const userRef = doc(db, COLLECTIONS.USERS, targetUid);
  await runTransaction(db, async (transaction) => {
    const [account, wallet] = await Promise.all([
      transaction.get(userRef),
      transaction.get(walletRef),
    ]);
    if (!account.exists() ||
      ![ROLES.STUDENT, ROLES.TUTOR, ROLES.PROFESSIONAL].includes(account.data().role)) {
      throw new Error('Choose an existing student or tutor account.');
    }
    if (!wallet.exists()) {
      transaction.set(walletRef, {
        ...INITIAL_WALLET,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

export function subscribeToWallet(uid, callback, onError) {
  if (!uid) throw new Error('subscribeToWallet needs an account id.');
  const authUid = requireAuth().currentUser?.uid;
  if (authUid !== uid) throw new Error('Only the signed-in account can view this wallet.');
  const { db } = requireFirebase();
  let active = true;
  let stop = () => {};

  ensureWallet(uid).then(() => {
    if (!active) return;
    stop = onSnapshot(
      doc(db, COLLECTIONS.WALLETS, uid),
      (snapshot) => {
        if (!snapshot.exists()) {
          onError?.(new Error('Your token wallet is not available.'));
          return;
        }
        callback({ ...snapshot.data(), id: snapshot.id });
      },
      onError,
    );
  }).catch((error) => {
    if (active) onError?.(error);
  });

  return () => {
    active = false;
    stop();
  };
}

export function subscribeToTokenTransactions(uid, callback, onError) {
  if (!uid) throw new Error('subscribeToTokenTransactions needs an account id.');
  const authUid = requireAuth().currentUser?.uid;
  if (!authUid) throw new Error('Sign in to view token history.');
  const { db } = requireFirebase();
  const historyQuery = query(
    collection(db, COLLECTIONS.TOKEN_TRANSACTIONS),
    where('accountId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(50),
  );
  let active = true;
  let stop = () => {};
  const startSubscription = () => {
    if (!active) return;
    stop = onSnapshot(
      historyQuery,
      (snapshot) => callback(snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id }))),
      onError,
    );
  };

  if (authUid === uid) {
    startSubscription();
  } else {
    getDoc(doc(db, COLLECTIONS.USERS, authUid)).then((profile) => {
      if (!profile.exists() || profile.data().role !== ROLES.ADMIN) {
        if (active) onError?.(new Error('You cannot view this account’s token history.'));
        return;
      }
      startSubscription();
    }).catch((error) => {
      if (active) onError?.(error);
    });
  }
  return () => {
    active = false;
    stop();
  };
}

export async function getAllWalletsForAdmin() {
  const { db } = requireFirebase();
  const adminUid = requireAuth().currentUser?.uid;
  if (!adminUid) throw new Error('Sign in as an administrator to manage wallets.');
  await requireAdmin(db, adminUid);
  const snapshot = await getDocs(collection(db, COLLECTIONS.WALLETS));
  return snapshot.docs.map((wallet) => ({ ...wallet.data(), id: wallet.id }));
}

export function createWalletAdjustmentId() {
  const { db } = requireFirebase();
  return doc(collection(db, COLLECTIONS.TOKEN_TRANSACTIONS)).id;
}

export async function adjustWalletBalance(
  targetUid,
  {
    direction,
    amountTokens,
    reason,
    formReference = '',
    operationId,
  } = {},
) {
  if (!targetUid) throw new Error('Choose an account to adjust.');
  if (!['credit', 'debit'].includes(direction)) {
    throw new Error('Choose whether to credit or debit tokens.');
  }
  const amountUnits = toTokenUnits(amountTokens);
  const cleanReason = typeof reason === 'string' ? reason.trim() : '';
  if (!cleanReason) throw new Error('A reason is required for every wallet adjustment.');
  if (cleanReason.length > 300) throw new Error('The reason must be 300 characters or fewer.');
  const cleanReference = typeof formReference === 'string' ? formReference.trim() : '';
  if (cleanReference.length > 200) {
    throw new Error('The external reference must be 200 characters or fewer.');
  }
  if (typeof operationId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(operationId)) {
    throw new Error('The wallet adjustment id is invalid.');
  }

  const { db } = requireFirebase();
  const adminUid = requireAuth().currentUser?.uid;
  if (!adminUid) throw new Error('Sign in as an administrator to adjust a wallet.');
  await requireAdmin(db, adminUid);
  await ensureWalletForAdmin(db, targetUid);
  const targetUserRef = doc(db, COLLECTIONS.USERS, targetUid);
  const walletRef = doc(db, COLLECTIONS.WALLETS, targetUid);
  const entryRef = doc(db, COLLECTIONS.TOKEN_TRANSACTIONS, operationId);
  const availableDelta = direction === 'credit' ? amountUnits : -amountUnits;
  const type = direction === 'credit'
    ? TOKEN_TRANSACTION_TYPES.ADMIN_CREDIT
    : TOKEN_TRANSACTION_TYPES.ADMIN_DEBIT;

  await runTransaction(db, async (transaction) => {
    const [targetUser, wallet, priorEntry] = await Promise.all([
      transaction.get(targetUserRef),
      transaction.get(walletRef),
      transaction.get(entryRef),
    ]);
    if (!targetUser.exists() || ![ROLES.STUDENT, ROLES.TUTOR, ROLES.PROFESSIONAL].includes(targetUser.data().role)) {
      throw new Error('Choose an existing student or tutor account.');
    }
    if (priorEntry.exists()) {
      const prior = priorEntry.data();
      const isSameAdjustment =
        prior.accountId === targetUid &&
        prior.actorUid === adminUid &&
        prior.type === type &&
        prior.amountUnits === amountUnits &&
        prior.reason === cleanReason &&
        prior.formReference === cleanReference;
      if (isSameAdjustment) return;
      throw new Error('This adjustment id has already been used for a different wallet change.');
    }

    const current = wallet.exists() ? wallet.data() : INITIAL_WALLET;
    const availableUnits = current.availableUnits + availableDelta;
    if (!Number.isSafeInteger(availableUnits) || availableUnits < 0) {
      throw new Error('This debit exceeds the account’s available token balance.');
    }
    if (!Number.isSafeInteger(current.heldUnits) || current.heldUnits < 0) {
      throw new Error('The account wallet has an invalid held balance; contact support.');
    }

    const updatedWallet = {
      ...current,
      availableUnits,
      heldUnits: current.heldUnits,
      updatedAt: serverTimestamp(),
      lastTransactionId: entryRef.id,
      ...(wallet.exists() ? {} : { createdAt: serverTimestamp() }),
    };
    if (wallet.exists()) transaction.update(walletRef, updatedWallet);
    else transaction.set(walletRef, updatedWallet);

    transaction.set(entryRef, {
      type,
      accountId: targetUid,
      amountUnits,
      availableDelta,
      heldDelta: 0,
      actorUid: adminUid,
      reason: cleanReason,
      formReference: cleanReference,
      createdAt: serverTimestamp(),
    });
  });
  return entryRef.id;
}
