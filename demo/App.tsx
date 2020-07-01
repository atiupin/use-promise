import React, { useState, useMemo, useCallback } from 'react';

import usePromise from '../src';

const fetchSquare = (number: number, throwError: boolean): Promise<number> =>
  new Promise((resolve, reject) =>
    setTimeout(
      () =>
        throwError ? reject(new Error('Boom!')) : resolve(number * number),
      1000,
    ),
  );

const formatError = (error?: Error) => (error ? error.message : String(error));

const App = () => {
  const [counter, setCounter] = useState(1);
  const [throwError, setThrowError] = useState(false);

  const fetchSquareMemo = useCallback(
    (counter: number) => fetchSquare(counter, throwError),
    [counter, throwError],
  );

  const promise = useMemo(() => fetchSquareMemo(counter), [
    fetchSquareMemo,
    counter,
  ]);

  const onMountState = usePromise({ promise });

  const onEventState = usePromise({ promiseThunk: fetchSquareMemo });

  const counterNode = <p>Counter: {counter}</p>;
  const plusCounterNode = (
    <button onClick={() => setCounter((n) => n + 1)}>Plus Counter</button>
  );
  const toggleThrowErrorsNode = (
    <label htmlFor="throwError">
      <input
        type="checkbox"
        id="throwError"
        checked={throwError}
        onChange={(e) => setThrowError(e.target.checked)}
      />
      Throw errors
    </label>
  );

  return (
    <>
      <style>
        {`
          body {
            font-family: sans-serif;
            padding: 0;
            margin: 0;
          }
          article {
            max-width: 800px;
            padding: 30px 20px;
            margin: 0 auto;
          }
          code {
            display: block;
            color: crimson;
            background-color: #f1f1f1;
            padding: 5px 10px;
            margin: 0 -10px;
            font-size: 15px;
          }
          section {
            background-color: #f1f1f1;
            padding: 1px 10px;
            margin: 0 -10px;
          }
          section > p {
            margin: 14px 0;
          }
          h1 {
            font-size: 35px;
          }
          h5 {
            color: grey;
            margin-bottom: 5px;
            letter-spacing: 0.5px;
          }
          p, code {
            line-height: 1.5em;
          }
        `}
      </style>
      <article>
        <h1>use-promise demo</h1>
        <p>
          In this example we have a counter and async function fetchSquare, that
          returns square of any number after 1 second. "Throw errors" toggles if
          fetchSquare will resolve or rejects promise.
        </p>
        <h2>Run promise on data update</h2>
        <p>
          Simpliest way to use usePromise — pass a promise argument in config.
          It will run it instantly on component mount.
        </p>
        <code>
          {
            'const promise = useMemo(() => fetchSquare(counter), [fetchSquare, counter]);'
          }
          <br />
          {'const { data, error, loading } = usePromise({ promise });'}
        </code>
        <p>
          You must memoize promise in advance or you'll get an infinite loop,
          because running a promise will cause component to rerender.
        </p>
        <h5>PLAYGROUND</h5>
        <section>
          {counterNode}
          <p>
            Data: {String(onMountState.data)}
            <br />
            Error: {formatError(onMountState.error)}
            <br />
            Loading: {String(onMountState.loading)}
          </p>
          <p>
            {plusCounterNode} {toggleThrowErrorsNode}
          </p>
        </section>
        <p>
          Note now changing the counter generates new promise and cancels
          previous one.
        </p>
        <h2>Run promise on demand</h2>
        <p>
          Slightly more complex way to use usePromise. Pass function that
          returns promise in promiseThunk, and then call run callback on button
          click or something.
        </p>
        <code>
          {
            'const { data, error, loading, run } = usePromise({ promiseThunk: fetchSquare });'
          }
          <br />
          {'<button onClick={() => run(counter)}>Run Promise</button>'}
        </code>
        <p>
          You don't have to memoize anything here, but new promiseThunk will
          return new run callback, promiseThunk call will be canceled only if
          you call run it again.
        </p>
        <h5>PLAYGROUND</h5>
        <section>
          {counterNode}
          <p>
            Data: {String(onEventState.data)}
            <br />
            Error: {formatError(onEventState.error)}
            <br />
            Loading: {String(onEventState.loading)}
          </p>
          <p>
            <button onClick={() => onEventState.run(counter)}>
              Run Promise
            </button>{' '}
            {plusCounterNode} {toggleThrowErrorsNode}
          </p>
        </section>
      </article>
    </>
  );
};

export default App;
