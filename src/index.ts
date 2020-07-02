import { useCallback, useEffect, useReducer, useRef, Reducer } from 'react';

export interface PromiseConfig<T, U> {
  promise?: Promise<T>;
  promiseThunk?: (payload: U) => Promise<T>;
  onResolve?: (data: T) => any;
  onReject?: (error: Error) => any;
}

interface InternalState<T> {
  data?: T;
  error?: Error;
  isPending: boolean;
}

export interface PromiseState<T, U> extends InternalState<T> {
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
  isPending: false,
};

const reducer = <T>(
  state: InternalState<T>,
  action: Action<T>,
): InternalState<T> => {
  switch (action.type) {
    case actionTypes.run:
      return Object.assign({}, state, {
        error: undefined,
        isPending: true,
      });
    case actionTypes.resolve:
      return Object.assign({}, state, {
        data: action.payload,
        error: undefined,
        isPending: false,
      });
    case actionTypes.reject:
      return Object.assign({}, state, {
        error: action.payload,
        isPending: false,
      });
    case actionTypes.cancel:
      return Object.assign({}, state, {
        isPending: false,
      });
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
  const usedReducer = useReducer<Reducer<InternalState<T>, Action<T>>>(
    reducer,
    defaultState,
  );

  const state = usedReducer[0];
  const dispatch = usedReducer[1];

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
              onResolve(data);
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
              onReject(error);
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

  return Object.assign({}, state, {
    run,
  });
};

export default usePromise;
