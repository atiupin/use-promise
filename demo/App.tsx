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

  const dataDrivenState = usePromise({ promise });

  const callbackState = usePromise({ promiseThunk: fetchSquareMemo });

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
          section {
            background-color: #f1f1f1;
            padding: 1px 10px;
            margin: 0 -10px;
          }
          h1 {
            font-size: 35px;
          }
          h2 {
            margin-top: 30px;
            margin-bottom: 0px;
          }
          p {
            line-height: 1.5em;
            margin: 10px 0;
          }
        `}
      </style>
      <article>
        <h1>use-promise demo</h1>
        <p>
          This is just a demo/testing page. Read{' '}
          <a href="https://github.com/alextewpin/use-promise">documentation</a>,
          if you want to learn about the hook usage.
        </p>
        <p>
          In this example we have a counter and async function, that returns
          square of any number after 1 second. "Throw errors" toggles if it will
          resolve or rejects promise.
        </p>
        <section>
          <p>Counter: {counter}</p>
          <p>
            <button onClick={() => setCounter((n) => n + 1)}>
              Plus Counter
            </button>
          </p>
          <p>
            <label htmlFor="throwError">
              <input
                type="checkbox"
                id="throwError"
                checked={throwError}
                onChange={(e) => setThrowError(e.target.checked)}
              />
              Throw errors
            </label>
          </p>
        </section>
        <h2>Data-driven</h2>
        <p>
          This data directly depends on promise and will update automatically.
        </p>
        <section>
          <p>
            data: {String(dataDrivenState.data)}
            <br />
            error: {formatError(dataDrivenState.error)}
            <br />
            isPending: {String(dataDrivenState.isPending)}
          </p>
        </section>
        <h2>Callback</h2>
        <p>Here promise have to be run by pressing the button.</p>
        <section>
          <p>
            data: {String(callbackState.data)}
            <br />
            error: {formatError(callbackState.error)}
            <br />
            isPending: {String(callbackState.isPending)}
          </p>
          <p>
            <button onClick={() => callbackState.run(counter)}>
              Run Promise
            </button>
          </p>
        </section>
      </article>
    </>
  );
};

export default App;
