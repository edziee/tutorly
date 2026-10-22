import { useEffect, useRef, useState } from 'react';

export function useSubscription(subscribe, deps = []) {
  const [state, setState] = useState({
    status: 'loading',
    data: null,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  const subscribeRef = useRef(subscribe);
  subscribeRef.current = subscribe;

  useEffect(() => {
    setState({ status: 'loading', data: null, error: null });

    let stop;
    let active = true;

    const onError = (error) => {
      if (active) {
        setState({ status: 'error', data: null, error });
      }
    };

    try {
      stop = subscribeRef.current((data) => {
        if (active) {
          setState({ status: 'ready', data, error: null });
        }
      }, onError);
    } catch (error) {
      onError(error);
    }

    return () => {
      active = false;
      if (typeof stop === 'function') stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  return {
    ...state,
    retry: () => setAttempt((count) => count + 1),
  };
}