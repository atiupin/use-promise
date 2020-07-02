# use-promise

Hook for declarative promises. Useful for fetching data, sending forms and doing other async stuff right in component. Tiny, easy to use, TypeScript definitions included. Inspired by outstanding [react-async](https://www.npmjs.com/package/react-async) library.

## Installation

```
$ npm i @alextewpin/use-promise
```

## Usage

### Data-driven

Simpliest way to use `use-promise` is to create a memoized data-dependent promise and pass it to the hook config:

```js
import React, { useMemo } from 'react';
import usePromise from '@alextewpin/use-promise';

import { fetchUser } from 'api';

const Profile = ({ userId }) => {
  const promise = useMemo(() => fetchUser(userId), [userId]);

  const { data, error, isPending } = usePromise({ promise });

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Something is wrong</div>;
  return <div>Hi, {user.name}!</div>;
};
```

Note that you must memoize promise in advance or you'll get an infinite loop, because running a promise will cause component to rerender. `usePromise` doesn't use list of dependencies, promise is dependency itself.

### By callback

Another handy way to call a promise is using `promiseThunk` in config and `run` callback. This way it useful for sending forms and other cases when you need to do something as a respond to user actions.

```js
import React, { useState } from 'react';
import usePromise from '@alextewpin/use-promise';

import { sendFeedback } from 'api';

const FeedbackForm = () => {
  const [feedback, setFeedback] = useState('');

  const { data, error, isPending, run } = usePromise({
    promiseThunk: sendFeedback,
    onResolve: () => {
      window.location = '/thankyou';
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(feedback);
      }}
    >
      <textarea
        disabled={isPending}
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
      />
      <button disabled={isPending}>Submit</button>
      {error && <div>Something is wrong</div>}
    </form>
  );
};
```

In this case there is no need to memoize `promiseThunk` or `onResolve`. However, `run` is still dependent on these parameters, and will update accordingly.

### On cancelation

Only one pending promise can exist in a hook state. If new promise is created for any reason (e.g. dependency update or `run` call), previous promise will be discared and `onResolve` or `onReject` will not be called on it. Also, this will happen if component is unmounted.

However, `data` will never be discarded.

### Demo

Check out live examples on demo page and take a look on their source code.

## API

### usePromise

`<Data, Payload = undefined>(config: PromiseConfig<Data, Payload>) => PromiseState<Data, Payload>`

Default export, hook that accepts `PromiseConfig` and returns `PromiseState`. In most cases there is not need to pass types manually.

### interface PromiseConfig<Data, Payload>

| Parameter      | Type                                  | Desrciption                                                                                                                   |
| -------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `promise`      | `Promise<Data>`                       | Promise, that will automatically runned on mount. Mutually exclusive with `promiseThunk`. Dependent on every other parameter. |
| `promiseThunk` | `(payload: Payload) => Promise<Data>` | Function that returns promise, can be called manually with `run`. Mutually exclusive with `promise`.                          |
| `onResolve`    | `(data: Data) => any`                 | Function that will be called on promise resolution.                                                                           |
| `onReject`     | `(error: Error) => any`               | Function that will be called on promise rejection.                                                                            |

### interface PromiseState<Data, Payload>

| Parameter   | Type                         | Desrciption                              |
| ----------- | ---------------------------- | ---------------------------------------- |
| `data`      | `Data \| undefined`          | Result of resolved promise.              |
| `error`     | `Error \| undefined`         | Error of rejected promise.               |
| `isPending` | `boolean`                    | Promise pending status.                  |
| `run`       | `(payload: Payload) => void` | Run `promiseThunk` with given `Payload`. |
