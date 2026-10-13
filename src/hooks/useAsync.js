// Loads data once from a service function and gives the screen a simple state.
//
//   const { status, data, error, retry } = useAsync(
//     () => adminService.getUsers({ role }),
//     [role],
//   );
//
// status is 'loading' while the request runs, then 'ready' (data is the result)
// or 'error' (error is what was thrown). `retry()` runs the request again, for
// the "Try again" button and pull-to-refresh. `refreshing` is true while a
// retry runs after data was already shown, so the list does not blank out.
// (A retry after an error shows the loading state again instead.)
// If the screen closes or `deps` change before the request finishes, the old
// answer is ignored.
import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsync(load, deps = []) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const loadRef = useRef(load);
  loadRef.current = load;
  const requestId = useRef(0);
  const statusRef = useRef('loading');
  statusRef.current = state.status;

  const run = useCallback((isRetry) => {
    const id = ++requestId.current;
    if (isRetry && statusRef.current === 'ready') {
      // Keep showing the old data while the new request runs.
      setRefreshing(true);
    } else {
      setState({ status: 'loading', data: null, error: null });
    }

    // Wrap in an async function so a service that throws right away (a
    // placeholder) ends up in the same error path as one that fails later.
    (async () => loadRef.current())()
      .then((data) => {
        if (id !== requestId.current) return;
        setState({ status: 'ready', data, error: null });
        setRefreshing(false);
      })
      .catch((error) => {
        if (id !== requestId.current) return;
        setState({ status: 'error', data: null, error });
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    run(false);
    return () => {
      requestId.current += 1; // ignore the answer if the screen closes first
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, refreshing, retry: () => run(true) };
}
