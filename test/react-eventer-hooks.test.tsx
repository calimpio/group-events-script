import React, { act, useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { eventer } from '../index';
import { useArray, useSubscriberData, useValidator, useValidatorJoin } from '../react-eventer';

describe('React hooks (react-eventer)', () => {
  test('useArray updates when items are added/removed', async () => {
    const initial = [1, 2, 3];
    let createFn: (() => void) | undefined;
    let removeFn: ((item: number) => () => void) | undefined;

    function Test() {
      const api = useArray(initial, () => 0);
      useEffect(() => {
        createFn = api.create();
        removeFn = api.remove;
      }, [api]);
      return <span data-testid="array">{JSON.stringify(api.array)}</span>;
    }

    render(<Test />);

    await waitFor(() => expect(screen.getByTestId('array').textContent).toBe(JSON.stringify([1, 2, 3])));

    await waitFor(() => expect(createFn).toBeDefined());
    act(() => {
      createFn?.();
    });
    await waitFor(() => expect(screen.getByTestId('array').textContent).toBe(JSON.stringify([1, 2, 3, 0])));

    await waitFor(() => expect(removeFn).toBeDefined());
    act(() => {
      removeFn?.(1)();
    });
    await waitFor(() => expect(screen.getByTestId('array').textContent).toBe(JSON.stringify([2, 3, 0])));
  });

  test('useValidator undefined when buildValidator is false', async () => {
    function Test() {
      const [value] = useValidator(undefined, false);
      expect(value).toBeUndefined();
      return <span data-testid="value">ok</span>;
    }
    render(<Test />);
  })

  test('useValidatorJoin undefined when key or validator is undefined', async () => {
    function Test() {
      const [v1] = useValidator();
      expect(typeof v1 == "object").toBe(true);
      const [join] = useValidatorJoin(undefined, undefined);
      expect(join).toBeUndefined();
      const [join2] = useValidatorJoin(undefined, v1);
      expect(join2).toBeUndefined();
      const [join3] = useValidatorJoin("x", undefined);
      expect(join3).toBeUndefined();
      const [join4] = useValidatorJoin("x", v1);
      expect(typeof join4 == "object").toBe(true);
      return <span data-testid="value">ok</span>;
    }
    render(<Test />);
  })

  test('useSubscriberData updates when observable changes', async () => {
    const obs = eventer().createObservable('obs')<number>(0);
    let subscriber: ReturnType<typeof useSubscriberData<number>>[1];

    function Test() {
      const [value, subs] = useSubscriberData(obs);
      useEffect(() => {
        subscriber = subs;
      }, [subs]);
      return <span data-testid="value">{String(value)}</span>;
    }

    render(<Test />);

    await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('0'));

    await act(async () => {
      await subscriber.next(42);
    });

    await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('42'));
  });
});
