import React, { FC, useState, useCallback, useEffect } from 'react';

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

const App: FC = () => {
  const [counter, setCounter] = useState(1);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [throwError, setThrowError] = useState(false);

  const { data, error, payload, isPending, run } = usePromise({
    promiseThunk: useCallback(
      (counter: number) => fetchSquare(counter, throwError),
      [throwError],
    ),
  });

  useEffect(() => {
    if (autoUpdate) {
      run(counter);
    }
  }, [autoUpdate, run, counter]);

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
            margin-bottom: 10px;
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
          square of any number after 1 second. &quot;Throw errors&quot; toggles
          if it will resolve or rejects promise.
        </p>
        <h2>Component State</h2>
        <section>
          <p>Counter: {counter}</p>
          <p>
            <button onClick={() => setCounter((n) => n + 1)}>
              Plus Counter
            </button>
          </p>
          <p>
            <label htmlFor="autoUpdate">
              <input
                type="checkbox"
                id="autoUpdate"
                checked={autoUpdate}
                onChange={(e) => setAutoUpdate(e.target.checked)}
              />
              Update automatically
            </label>
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
        <h2>Promise State</h2>
        <section>
          <p>
            data: {String(data)}
            <br />
            error: {formatError(error)}
            <br />
            payload: {payload ? JSON.stringify(payload) : String(payload)}
            <br />
            isPending: {String(isPending)}
          </p>
          <p>
            <button onClick={() => run(counter)}>Run Promise</button>
          </p>
        </section>
      </article>
    </>
  );
};

export default App;
