import React, { act, use, useEffect, useState } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { eventer } from '../index';
import { useArray, useListener, useSubscriberData, useValidator, useValidatorInput, useValidatorJoin, useValidatorJoinLeft } from '../react-eventer';
import { ValidatorController } from 'eventer';

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

  test('useValidatorJoinLeft joins to lsiten a joined changes model validator', async () => {
    let doChange = false;
    function Child({ ...props }) {

      const [child] = useValidator<{ b: string }>({ b: 'bar' });
      expect(typeof props.parent == "object").toBe(true);
      expect(typeof child == "object").toBe(true);
      useValidatorJoinLeft(child, props?.parent, "parent");

      useEffect(() => {
        child?.getProps('b').onChange('roo');
      }, [])

      return <div data-testid="child">ok</div>
    }

    function Parnet() {
      const [parent] = useValidator<{ a: string }>({ a: 'foo' });

      useListener(parent?.listeners().createJoinOnChangeListener, (joinKey, key, target, model) => {
        expect(joinKey).toBe("parent");
        expect(key).toBe("b");
        expect(typeof target == "object").toBe(true);
        expect(typeof model == "object").toBe(true);
        doChange = true;
      })

      return <Child parent={parent} />;
    }

    render(<Parnet />);

    await waitFor(() => expect(doChange).toBe(true));
    expect(doChange).toBe(true);

  })

  test('useValidatorInput with validation', async () => {
    let validationResult = false;
    function Test() {
      const [validator] = useValidator<{ name: string }>({ name: '' });
      const [inputProps] = useValidatorInput('name', '', validator, (value) => {
        validationResult = value.length > 3;
        return validationResult;
      });

      return (
        <input data-testid="name-input" {...inputProps} />
      );
    }

    render(<Test />);

    const input = screen.getByTestId('name-input');

    fireEvent.change(input, { target: { value: 'John' } });

    await waitFor(() => expect(validationResult).toBe(true));
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
