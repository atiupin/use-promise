import { useCallback, useEffect, useReducer, useRef, Reducer } from 'react';

export interface PromiseConfig<T, U> {
  promiseThunk(payload: U): Promise<T>;
  onResolve?(data: T, payload: U): void;
  onReject?(error: Error, payload: U): void;
}

interface InternalState<T, U> {
  data?: T;
  error?: Error;
  payload?: U;
  isPending: boolean;
}

export interface PromiseState<T, U> extends InternalState<T, U> {
  run: (payload: U) => void;
}

enum actionTypes {
  run = 'run',
  resolve = 'resolve',
  reject = 'reject',
  cancel = 'cancel',
}

interface RunAction<U> {
  payload: U;
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

type Action<T, U> =
  | RunAction<U>
  | ResolveAction<T>
  | RejectAction
  | CancelAction;

const defaultState = {
  data: undefined,
  error: undefined,
  payload: undefined,
  isPending: false,
};

const reducer = <T, U>(
  state: InternalState<T, U>,
  action: Action<T, U>,
): InternalState<T, U> => {
  switch (action.type) {
    case actionTypes.run:
      return Object.assign({}, state, {
        error: undefined,
        payload: action.payload,
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

const usePromise = <T, U>({
  promiseThunk,
  onResolve,
  onReject,
}: PromiseConfig<T, U>): PromiseState<T, U> => {
  const pendingPromiseRef = useRef<Promise<void> | null>(null);
  const usedReducer = useReducer<Reducer<InternalState<T, U>, Action<T, U>>>(
    reducer,
    defaultState,
  );

  const state = usedReducer[0];
  const dispatch = usedReducer[1];

  useEffect(
    () => () => {
      pendingPromiseRef.current = null;

      dispatch({
        type: actionTypes.cancel,
      });
    },
    [dispatch],
  );

  const run = useCallback(
    (payload: U) => {
      dispatch({ type: actionTypes.run, payload });

      const pendingPromise = promiseThunk(payload)
        .then((data) => {
          if (pendingPromise === pendingPromiseRef.current) {
            dispatch({
              payload: data,
              type: actionTypes.resolve,
            });

            if (onResolve) {
              onResolve(data, payload);
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
              onReject(error, payload);
            }
          }
        });

      pendingPromiseRef.current = pendingPromise;
    },
    [dispatch, promiseThunk, onReject, onResolve],
  );

  return Object.assign({}, state, {
    run,
  });
};

export default usePromise;
