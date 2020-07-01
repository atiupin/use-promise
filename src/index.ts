import { useCallback, useEffect, useReducer, useRef, Reducer } from 'react';

interface PromiseConfig<T, U> {
  promise?: Promise<T>;
  promiseThunk?: (payload: U) => Promise<T>;
  onResolve?: () => any;
  onReject?: () => any;
}

interface InternalState<T> {
  data?: T;
  error?: Error;
  loading: boolean;
}

interface PromiseState<T, U> extends InternalState<T> {
  run: (payload: U) => void;
}

enum actionTypes {
  run = 'run',
  resolve = 'resolve',
  reject = 'reject',
  cancel = 'cancel',
}

interface RunAction {
  type: actionTypes.run;
}

interface ResolveAction<T> {
  payload: T;
  type: actionTypes.resolve;
}

interface RejectAction {
  payload: Error;
  type: actionTypes.reject;
}

interface CancelAction {
  type: actionTypes.cancel;
}

type Action<T> = RunAction | ResolveAction<T> | RejectAction | CancelAction;

const defaultState = {
  data: undefined,
  error: undefined,
  loading: false,
};

const reducer = <T>(
  state: InternalState<T>,
  action: Action<T>,
): InternalState<T> => {
  switch (action.type) {
    case actionTypes.run:
      return {
        ...state,
        error: undefined,
        loading: true,
      };
    case actionTypes.resolve:
      return {
        ...state,
        data: action.payload,
        error: undefined,
        loading: false,
      };
    case actionTypes.reject:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case actionTypes.cancel:
      return {
        ...state,
        loading: false,
      };
    default:
      return state;
  }
};

const usePromise = <T, U = undefined>({
  promise: userPromise,
  promiseThunk,
  onResolve,
  onReject,
}: PromiseConfig<T, U>): PromiseState<T, U> => {
  const pendingPromiseRef = useRef<Promise<void> | null>(null);
  const [state, dispatch] = useReducer<Reducer<InternalState<T>, Action<T>>>(
    reducer,
    defaultState,
  );

  if (userPromise && promiseThunk)
    throw new Error(
      'Both promise and promiseThunk are defined. This is not intended use of usePromise, each hook should correspond to one piece of data.',
    );

  useEffect(
    () => (): void => {
      pendingPromiseRef.current = null;

      dispatch({
        type: actionTypes.cancel,
      });
    },
    [userPromise],
  );

  const runPromise = useCallback(
    (promise: Promise<T>) => {
      dispatch({ type: actionTypes.run });

      const pendingPromise = promise
        .then((data) => {
          if (pendingPromise === pendingPromiseRef.current) {
            dispatch({
              payload: data,
              type: actionTypes.resolve,
            });

            if (onResolve) {
              onResolve();
            }
          }
        })
        .catch((error) => {
          if (pendingPromise === pendingPromiseRef.current) {
            dispatch({
              payload: error,
              type: actionTypes.reject,
            });

            if (onReject) {
              onReject();
            }
          }
        });

      pendingPromiseRef.current = pendingPromise;
    },
    [onResolve, onReject],
  );

  const run = useCallback(
    (payload: U) => {
      if (promiseThunk) {
        runPromise(promiseThunk(payload));
      }
    },
    [promiseThunk, runPromise],
  );

  useEffect(() => {
    if (userPromise) {
      runPromise(userPromise);
    }
  }, [userPromise, runPromise]);

  return {
    ...state,
    run,
  };
};

export default usePromise;
