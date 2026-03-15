import { eventer, EmitResult } from '../index';

describe('Eventer core functionality', () => {
  describe('basic EventController', () => {
    test('listener called on emit and state updates', async () => {
      const events = eventer('test');
      const userLoggedIn = events.createEvent('userLoggedIn')<[string, string]>();
      let called = false;
      userLoggedIn.createListener().on((id, name) => {
        called = true;
        expect(id).toBe('123');
        expect(name).toBe('Alice');
      });

      expect(called).toBe(false);
      await userLoggedIn.emit('123', 'Alice');
      expect(called).toBe(true);
    });

    test('emitParallel executes multiple listeners', async () => {
      const events = eventer();
      const ev = events.createEvent('parallel')<[]>();
      let count = 0;
      ev.createListener().on(() => { count += 1; });
      ev.createListener().on(() => { count += 1; });
      await ev.emitParallel();
      expect(count).toBe(2);
    });

    test('emitSettled returns errors when listener throws', async () => {
      const events = eventer();
      const ev = events.createEvent('settled', { onError: 'continue' })<[]>();
      ev.createListener().on(() => { throw new Error('boom'); });
      const result: EmitResult<void> = await ev.emitSettled();
      expect(result.success).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].originalError.message).toBe('boom');
    });

    test('removeEvent clears listeners', async () => {
      const events = eventer();
      const ev = events.createEvent('remove')<[]>();
      let called = false;
      ev.createListener().on(() => { called = true; });
      ev.removeEvent();
      await ev.emit();
      expect(called).toBe(false);
    });
  });

  describe('broadcast events', () => {
    test('broadcastEmit gathers return values', async () => {
      const events = eventer();
      const validate = events.createBroadcast('validate')<[number], boolean>();
      validate.createBroadcastListener().on((n) => n > 0);
      validate.createBroadcastListener().on((n) => n % 2 === 0);
      const res = await validate.broadcastEmit(4);
      expect(res).toEqual([true, true]);
    });

    test('broadcastEmitSettled collects errors when listeners fail', async () => {
      const events = eventer();
      const validate = events.createBroadcast('vsettled', { onError: 'continue' })<[void], string>();
      validate.createBroadcastListener().on(() => 'ok');
      validate.createBroadcastListener().on(() => { throw new Error('err'); });
      const settled = await validate.broadcastEmitSettled();
      expect(settled.results?.length).toBe(1);
      expect(settled.errors.length).toBe(1);
      expect(settled.errors[0].originalError.message).toBe('err');
    });
  });

  describe('observable controllers', () => {
    test('next/get and subscribers work', async () => {
      const events = eventer();
      const counter = events.createObservable('counter')<number>(0);
      expect(counter.get()).toBe(0);
      const sub = counter.createSubscriber();
      let observed = 0;
      sub.subscribe((v) => { observed = v; });
      await counter.next(5);
      expect(counter.get()).toBe(5);
      expect(observed).toBe(5);
      await sub.unsubscribe();
    });

    test('switch toggles boolean', async () => {
      const events = eventer();
      const flag = events.createObservable('flag')<boolean>(false);
      const first = await flag.switch();
      expect(first).toBe(true);
      const second = await flag.switch();
      expect(second).toBe(false);
    });

    test('increment/decrement operate on numbers', async () => {
      const events = eventer();
      const num = events.createObservable('num')<number>(10);
      const inc = await num.increment();
      expect(inc).toBe(11);
      const dec = await num.decrement(2);
      expect(dec).toBe(9);
    });

    test('readOnly hides next method', () => {
      const events = eventer();
      const obs = events.createObservable('ro')<string>('x');
      const ro = obs.readOnly();
      expect(ro.get()).toBe('x');
      // @ts-expect-error
      expect((ro as any).next).toBeUndefined();
    });
  });

  describe('loader controller', () => {
    test('exec and listeners', async () => {
      const events = eventer();
      const loader = events.createLoader('ld', async (v: number) => v * 2);
      let done = false;
      loader.listeners().createOnDoneListener().on((data) => {
        expect(data).toBe(6);
        done = true;
      });
      const result = await loader.exec(3);
      expect(result).toBe(6);
      expect(loader.isLoading()).toBe(false);
      expect(done).toBe(true);
    });
  });

  describe('task manager', () => {
    test('addTask and execTasks process tasks sequentially', async () => {
      const events = eventer();
      const manager = events.createTasksManager('tm');
      const order: number[] = [];
      manager.addTask('a', async () => { order.push(1); });
      manager.addTask('b', async () => { order.push(2); });
      await manager.execTasks();
      expect(order).toEqual([1, 2]);
      expect(manager.isExecuting()).toBe(false);
    });
  });

  describe('validator controller', () => {
    test('set and get model + onChange', async () => {
      const events = eventer();
      const val = events.createValidator<{ x: number }>('v');
      val.setModel({ x: 1 });
      expect(val.getModel()).toEqual({ x: 1 });
      val.getProps('x', (v) => { }).onChange(2);
      // give time for debounce
      await new Promise((r) => setTimeout(r, 150));
      expect(val.getModel()?.x).toBe(2);
    });

    test('join another validator', () => {
      const events = eventer();
      const parent = events.createValidator<{ a: string }>('p');
      const child = events.createValidator<{ b: string }>('c');
      parent.join('child', child);
      parent.setModel({ a: 'foo' });
      child.setModel({ b: 'bar' });
      expect(parent.getModel()).toEqual({ a: 'foo' });
      expect(child.getModel()).toEqual({ b: 'bar' });
    });    

    test('joins to lsiten a joined changes model validator', async () => {
      const events = eventer();
      const parent = events.createValidator<{ a: string }>('p');
      const child = events.createValidator<{ b: string }>('c');
      parent.setModel({ a: 'foo' });
      child.setModel({ b: 'bar' });
      child.join('parent', parent);
      let doChange = false; 
      parent.listeners().createJoinOnChangeListener().on((lookupKey, key, child, model) => {
        expect(lookupKey).toBe('parent');
        expect(key).toBe('b');
        expect(child).toBe(child);
        expect(model).toEqual({ b: 'baz' });
        doChange = true;
      });      
      child.getProps('b').onChange('baz');
      // give time for debounce and re-render breaks
      await new Promise((r) => setTimeout(r, 150));
      expect(doChange).toBe(true);    
    })

    test('useValidatorOnChanges should listen to model changes', async () => {
      const events = eventer();
      const validator = events.createValidator<{ name: string; email: string }>('userForm');
      validator.setModel({ name: 'John', email: 'john@example.com' });

      const changes: { key: any; value: any }[] = [];
      const listener = validator.getEvents().listeners().createOnChangeListener();
      listener.on((key, value) => {
        changes.push({ key, value });
      });

      // Simulate input change
      validator.getProps('name').onChange('Jane');

      // Wait for debounce in getProps
      await new Promise(r => setTimeout(r, 150));

      expect(changes.length).toBe(1);
      expect(changes[0].key).toBe('name');
      expect(changes[0].value).toBe('Jane');
      expect(validator.getModel()?.name).toBe('Jane');

      // Simulate another input change
      validator.getProps('email').onChange('jane@example.com');

      // Wait for debounce
      await new Promise(r => setTimeout(r, 150));

      expect(changes.length).toBe(2);
      expect(changes[1].key).toBe('email');
      expect(changes[1].value).toBe('jane@example.com');
      expect(validator.getModel()?.email).toBe('jane@example.com');

      listener.remove();
    })
  });

  describe('timer controller', () => {
    beforeAll(() => {
      jest.useFakeTimers();
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    test('start and complete emits completed listener', async () => {
      const events = eventer();
      const timer = events.createTimer('t')<[]>();
      let completed = false;
      timer.listeners().createOnCompletedListener().on(() => {
        completed = true;
      });
      timer.start(20, 5, () => []);
      // advance far beyond required ticks (20 * 5ms = 100ms)
      jest.advanceTimersByTime(200);
      // flush all timers/immediates
      await jest.runAllTimersAsync();
      expect(completed).toBe(true);
    });

    test('stop emits stopped and prevents further ticks', async () => {
      const events = eventer();
      const timer = events.createTimer('ts')<[void]>();
      let stopped = false;
      timer.listeners().createOnStoppedListener().on(() => {
        stopped = true;
      });
      timer.start(20, 5, () => []);
      jest.advanceTimersByTime(10);
      timer.stop();
      // flush any pending timers
      await jest.runAllTimersAsync();
      expect(stopped).toBe(true);
    });
  });
});
