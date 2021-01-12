import { useCallback, useEffect, useReducer, useRef, Reducer } from 'react';

export interface PromiseConfig<Data, Payload extends unknown[]> {
  promiseThunk(...payload: Payload): Promise<Data>;
  onResolve?(data: Data, ...payload: Payload): void;
  onReject?(error: Error, ...payload: Payload): void;
}

interface InternalState<Data, Payload> {
  data?: Data;
  error?: Error;
  payload?: Payload;
  isPending: boolean;
}

export interface PromiseState<Data, Payload extends unknown[]>
  extends InternalState<Data, Payload> {
  run: (...payload: Payload) => void;
}

enum actionTypes {
  run = 'run',
  resolve = 'resolve',
  reject = 'reject',
  cancel = 'cancel',
}

interface RunAction<Payload> {
  payload: Payload;
  type: actionTypes.run;
}

interface ResolveAction<Data> {
  payload: Data;
  type: actionTypes.resolve;
}

interface RejectAction {
  payload: Error;
  type: actionTypes.reject;
}

interface CancelAction {
  type: actionTypes.cancel;
}

type Action<Data, Payload> =
  | RunAction<Payload>
  | ResolveAction<Data>
  | RejectAction
  | CancelAction;

const defaultState = {
  data: undefined,
  error: undefined,
  payload: undefined,
  isPending: false,
};

const reducer = <Data, Payload>(
  state: InternalState<Data, Payload>,
  action: Action<Data, Payload>,
): InternalState<Data, Payload> => {
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

const usePromise = <Data, Payload extends unknown[]>({
  promiseThunk,
  onResolve,
  onReject,
}: PromiseConfig<Data, Payload>): PromiseState<Data, Payload> => {
  const pendingPromiseRef = useRef<Promise<void> | null>(null);
  const usedReducer = useReducer<
    Reducer<InternalState<Data, Payload>, Action<Data, Payload>>
  >(reducer, defaultState);

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
    (...payload: Payload) => {
      dispatch({ type: actionTypes.run, payload });

      const pendingPromise = promiseThunk(...payload)
        .then((data) => {
          if (pendingPromise === pendingPromiseRef.current) {
            dispatch({
              payload: data,
              type: actionTypes.resolve,
            });

            if (onResolve) {
              onResolve(data, ...payload);
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
              onReject(error, ...payload);
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
