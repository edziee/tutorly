// Listens to live data from a service and gives the screen a simple state.
//
//   const { status, data, error, retry } = useSubscription(
//     (onData) => notificationService.subscribeToNotifications(userId, onData),
//     [userId],
//   );
//
// status is 'loading' until the first data arrives, then 'ready', or 'error' if
// starting the listener threw (for example Firebase is not configured, or the
// service function is still a placeholder). `retry()` starts the listener again.
// The listener is stopped when the screen closes or `deps` change, so the app
// does not keep reading from Firestore in the background.
//
// `subscribe` receives the callback and must return the function that stops
// listening, which is what every subscribeTo... function in src/services does.
// Return nothing (undefined) to skip listening, for example when there is no
// logged-in user yet; the status then stays 'loading'.
import { useEffect, useRef, useState } from 'react';

export function useSubscription(subscribe, deps = []) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const subscribeRef = useRef(subscribe);
  subscribeRef.current = subscribe;

  useEffect(() => {
    setState({ status: 'loading', data: null, error: null });

    let stop;
    try {
      stop = subscribeRef.current((data) => {
        setState({ status: 'ready', data, error: null });
      });
    } catch (error) {
      setState({ status: 'error', data: null, error });
    }

    return () => {
      if (typeof stop === 'function') stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  return { ...state, retry: () => setAttempt((count) => count + 1) };
}
