// v: 3.0.5
// Ftd: (Feactures to dev)


export type ListenerController<Props extends any[], Returns = Promise<void> | void, Description = string> = {
    /**
     * Modificar el escuchador del evento. 
     * 
     * @param callback se ejecuta cuando se emite el evento.
     */
    on(callback: (...props: Props) => Returns, doOneTime?: boolean): void
    /**
     * Eliminar el escuchador del evento
     */
    remove(): void
    /**
     * Estado del escuchador
     */
    state: Readonly<"idle" | "removed" | "running" | "willRemove" | "desattached" | "willAttach">

    onRemoveEvent(callback: () => void): void
}

export type EventBrocastController<Props extends any[], Returns, Name = string> = {
    createBroadcastListener(): ListenerController<Props, Promise<Returns> | Returns, Name>
    broadcastEmit: (...params: Props) => Promise<Returns[] | undefined>;
}

export type EventController<Props extends any[] = [], Name = string> = {

    /**
    * Crear un unico escuchador en el evento. Implementar en los estados de React.
    */
    createListener(): ListenerController<Props, Promise<void> | void, Name>
    /**
     * Emitir evento
     * 
     * @param params 
     * @returns 
     */
    emit: (...params: Props) => Promise<void>;
    /**
     * Borrar todos los escucahdores
     */
    removeEvent(): void

}

export type EventObservableController<T, Name = string> = {
    /**
     * Modificar el valor y emite un evento al ser diferente el nuevo valor al antiguo.
     * @param value 
     * @returns 
     */
    next: (value: T, force?: boolean) => Promise<T>;
    /**
     * Crear escuchador unico. Cuando se quiere observar al moemnto de modificar el valor desde las vistas.
     * Opcional puedes añadir un escuchador
     * @param key 
     * @param callback
     * @param noFirstCall  
     * @returns 
     */
    createSubscriber: (key?: string, callback?: (value: T) => Promise<void> | void, noFirstCall?: boolean, doOneTime?: boolean) => SubscriberController<T, Name>
    /**
     * Obtener el valor
     */
    get(): T
    /**
     * Se ejecuta solo si existe un valor diferente de null o undifined
     * @param fun 
     */
    has(fun: (value: NonNullable<T>) => void): void
    /**
     * Eleminar todas las subcribciones
     */
    unsubscribes(): void

    readOnly(): EventObservableReaderController<T, Name>
}

export interface SubscriberController<T, Name = string> {
    /**
     * Subcribirse al evento unico. Cuando se quiere observar al moemnto de modificar el valor desde las vistas.
     * @param callback 
     * @param noFirstCall 
     * @returns 
     */
    subscribe: (callback: (value: T) => Promise<void> | void, noFirstCall?: boolean, doOneTime?: boolean) => ListenerController<[value: T], Promise<void> | void, Name>;
    /**
     * Modificar valor
     * @param value 
     * @returns 
     */
    next: (value: T, force?: boolean) => Promise<T>;
    /**
     * Eliminar evento
     * @returns 
     */
    unsubscribe: () => void
    /**
     * Obtener el valor
     */
    get(): T


}

export type SubscriberReaderController<T, Name = string> = Omit<SubscriberController<T, Name>, "next">

export interface EventObservableReaderController<T, Name = string> {
    get: EventObservableController<T, Name>["get"],
    createSubscriber(): SubscriberReaderController<T, Name>
}

export interface ValidatorController<Model, Name extends string = string> {
    /**
     * Añadir una propiedad a validar
     * @param key 
     * @param defaultValidationValue 
     */
    addProp(key: keyof Model, defaultValidationValue?: boolean): void
    /**
     * Modificar el modelo por completo
     * @param model 
     */
    setModel(model: Model): void
    /**
     * MOdificar el modelo parcialmente
     * @param model 
     */
    setPartialModel(model: Model): void
    /**
     * Obetener los eventos de una propiedad para el formulario
     * @param key 
     * @param onChange 
     */
    getProps(key: keyof Model, onChange?: (value: any, valid: EventObservableController<boolean>) => void): FormProps
    /**
     * Obetener los escuchadores para las acciones
     */
    getEvents(): FormEventsController<Model, `events of ${Name}`>
    /**
     * Obtener el modelo
     */
    getModel(): Model | undefined

    /**
     * Ejecutar validaciones usando es escuchador ValidationBroadcast
     */
    doValidation(): Promise<boolean>

    setDebug(value: boolean): void
    setTaskManager(v: TaskManager | null): void
    getTaskManager(): TaskManager | null
    listeners(): {
        createSetTaskManagerListener(): ListenerController<[taskManager: TaskManager | null]>
        /**
         * Devolver validaciones de los campos del modelo
         */
        createValidationBroadcastListener(): ListenerController<[], [PropertyKey, boolean], `To validate in props of ${Name}`>
    }
}

export interface FormEventsController<Model, Description extends string = string> {

    listeners(): {
        /**
        * Crear escuchador unico para cuando se modifiquen las propiedades
        * @param id 
        * @param callback 
        */
        createOnChangeListener(): ListenerController<[key: keyof Model, value: any], void | Promise<void>, `On change props in ${Description}`>
    }
}

export interface FormProps {
    /**
     * Evento cuando se cambie una propiedad
     * @param value 
     * @returns 
     */
    onChange: (value: any) => void
}

export interface LoaderController<Props extends any[], T, Description extends string = string> {
    /**
     * Ejecutar la tarea del evento, se ejecuta si no esta cargando.
     * @param props Parametros
     */
    exec(...props: Props): Promise<T | void>
    /**
     * Esta cargando la tarea
     */
    isLoading(): boolean
    /**
     * Modifica la tarea del cargador sin ejecutarla
     * @param callback 
     */
    setTask(callback: (...props: Props) => Promise<T>): LoaderController<Props, T>
    /**
     * Escuchadores
     */
    listeners(): {
        /**
         * Crear escuchador para cuando termine la tarea
         */
        createOnDoneListener(): ListenerController<[data: T], void | Promise<void>, `On task done of ${Description}`>
        /**
         * Crear escuchador para cuando hay un error
         */
        createOnErrorListener(): ListenerController<[error: any], void | Promise<void>, `On task error of ${Description}`>
    }

    readOnly(): {
        isLoading(): boolean
        listeners: LoaderController<Props, T, Description>["listeners"]
        exec: LoaderController<Props, T, Description>["exec"]
    }
}

export interface TaskManager<TKey extends string | number = string, Name extends string = string> {
    addTask(key: TKey, fun: () => Promise<any>): TaskManager<TKey>
    execTasks(): Promise<void>
    resetTasks(): void
    isExecuting(): boolean
    stop(): void
    setTaskValidator(key: TKey, validator: ValidatorController<any> | null): void
    listeners(): {
        createStartExecutionListener(): ListenerController<[], void | Promise<void>, `On start execution task of ${Name}`>
        createEndExecutionListener(): ListenerController<[], void | Promise<void>, `On end execution task of ${Name}`>
        createForEachAllTaskErrorListener(): ListenerController<[key: TKey, error: any], void | Promise<void>, `On for each all tasks execution of ${Name}`>
        createOnTaskDoneListener(key: TKey): ListenerController<[data: any], void | Promise<void>, `On tasks ${TKey} execution of ${Name}`> | undefined
    }
}

export interface TimerController<CompleteParams extends any[] = any[], Name extends string = string> {
    start(time: number, per: number, resolve: () => CompleteParams): void
    stop(): void
    pause(): void
    listeners(): {
        createOnStartedListener(): ListenerController<[percent: number], void | Promise<void>, `On start timer ${Name}`>
        createOnPausedListener(): ListenerController<[percent: number], void | Promise<void>, `On paused timer ${Name}`>
        createOnRunningListener(): ListenerController<[percent: number, total: number, stopped: boolean], void | Promise<void>, `On paused timer ${Name}`>
        createOnStoppedListener(): ListenerController<[percent: number], void | Promise<void>, `On stoped timer ${Name}`>
        createOnCompletedListener(): ListenerController<CompleteParams, void | Promise<void>, `On completed timer ${Name}`>
    }
}


export interface EventObservableMapController<Model> {
    mount(): EventObservableMapController<Model> | void
    get<Key extends keyof Model, TValue extends Model[Key]>(key: Key): ObsevavleMapTypeByKey<Model, Key, TValue>
    createSubscriber<Key extends keyof Model, TValue extends Model[Key]>(key: Key): SubscriberMapControllerByKey<Model, Key, TValue>
    getModel(): Model | undefined
    resetFrom(model: Model): EventObservableMapController<Model>
    getMap<Key extends keyof Model, TValue extends Model[Key]>(key: Key): ObservableMapper<TValue>
}

type EventMap = {
    [x: string]: ShareEventListener[]
}

interface ShareEventController {
    events: EventMap,
    doAfterExec: Record<string, (() => void)[]>;
    isExec: Record<string, boolean>;
}

type EventData<Props extends any[] = any[], Returns = any> = {
    name: string,
    handler: (...props: Props) => Returns,
    event: ShareEventController,
    debug?: boolean
    doOneTime: boolean
}

const makeDebuger = (_debug: { debug: boolean }) => (v: string) => _debug.debug ? console.info(v) : null

class ShareEventListener<Props extends any[] = any[], Returns = any> implements ListenerController<Props, Returns> {
    private name: string
    private handler: (...props: Props) => Returns
    private event: ShareEventController
    public debug: boolean
    private _willRemove = false;
    private doOneTime = false;
    private removed = false;
    private isrunning = false;
    private _onRemoveEvent = () => { };
    public get willRemove() {
        return this._willRemove;
    }

    constructor(data: EventData<Props, Returns>) {
        this.name = data.name;
        this.handler = data.handler;
        this.event = data.event;
        this.debug = data.debug || false;
        this.doOneTime = data.doOneTime;
    }

    run(...props: Props): Returns {
        this.isrunning = true;
        if (this.doOneTime) {
            this.event.doAfterExec[this.name].push(this.remove);
        }
        const data = this.handler(...props)
        this.isrunning = false;
        return data;
    }

    on(callback: (...props: Props) => Returns, doOneTime?: boolean): void {
        this.handler = callback;
        this.doOneTime = doOneTime || false;
        if (this.removed) {
            throw new Error("it's setting a listener that was removed");
        }
    }

    remove() {
        this._willRemove = true;
        const _delete = () => {
            const id = this.event.events[this.name]?.indexOf(this);
            if (id !== -1) {
                this.event.events[this.name]?.splice(id, 1);
                this.removed = true;
                if (this.debug) console.info('event removed: ' + this.name);
            }
        }
        if (!this.event.isExec[this.name]) {
            _delete();
        } else {
            if (this.debug) console.info('event will remove: ' + this.name);
            if (this.event.doAfterExec[this.name]) {
                this.event.doAfterExec[this.name].push(_delete);
            } else {
                this.event.doAfterExec[this.name] = [_delete];
            }
        }
    }

    removeEvent() {
        const next = this.event.events[this.name].shift();
        if (next) {
            next.removed = true;
            this._onRemoveEvent();
            next.removeEvent();
        }
    }

    onRemoveEvent(callback: () => void): void {
        this._onRemoveEvent = callback;
    }

    get state() {
        if (this.removed)
            return "removed";
        if (this.willRemove)
            return "willRemove"
        if (this.isrunning)
            return "running"
        return "idle";
    }

    createController(): ListenerController<Props, Returns> {
        const _self = this;

        return {
            on: (callback, doOneTime) => {
                this.on(callback, doOneTime);
            },
            remove: () => {
                this.remove();
            },
            get state() {
                return _self.state;
            },
            onRemoveEvent(callback) {
                _self.onRemoveEvent(callback);
            },
        }
    }
}



export default class GroupEvent {

    private tag: string;
    private isDebugModeOn: boolean
    private events: EventMap;
    private removeEvents: ShareEventListener[] = [];
    private isExec: Record<string, boolean> = {};
    private doAfterExec: Record<string, (() => void)[]> = {};


    constructor(tag: string = "e", isDebugModeOn?: boolean) {
        this.tag = tag;
        this.isDebugModeOn = isDebugModeOn || false;
        this.events = {};
    }


    private addListener<Props extends any[], Returns>(name: PropertyKey, callback: (...params: Props) => Returns, doOneTime?: boolean) {
        const _name = this.tag + name.toString();
        if (this.isDebugModeOn) console.info('add event: ' + name.toString());
        if (!this.events[_name]) this.events[_name] = [];
        const listener = new ShareEventListener({
            name: _name,
            handler: callback,
            event: {
                doAfterExec: this.doAfterExec,
                events: this.events,
                isExec: this.isExec,
            }, debug: this.isDebugModeOn,
            doOneTime: doOneTime || false
        });
        this.events[_name]?.push(listener);
        if (this.doAfterExec[_name] == undefined)
            this.doAfterExec[_name] = [];
        return listener.createController();
    }

    private createListenerInstance<Props extends any[], Returns>(name: PropertyKey, withRemovedSolution?: boolean): ListenerController<Props, Returns> {
        let _listener: ListenerController<Props, Returns> | null | undefined = null;
        // do not call functions from listener controller instances before return.
        return {
            on: (callback, doOneTime) => {
                const _callback: (...prams: Props) => Returns = (...params) => {
                    if (doOneTime) {
                        _listener = undefined;
                    }
                    return callback(...params);
                }
                try {
                    _listener ? _listener.on(_callback, doOneTime) : (_listener = this.addListener(name, _callback, doOneTime));
                } catch (err) {
                    if (withRemovedSolution && _listener !== undefined) {
                        _listener = this.addListener(name, _callback, doOneTime);
                    } else {
                        throw err;
                    }
                }
            },
            remove: () => {
                _listener?.remove();
                _listener = undefined;
            },
            get state() {
                if (_listener == null)
                    return "willAttach";
                if (_listener == undefined)
                    return "desattached";
                return _listener.state;
            },
            onRemoveEvent(callback) {
                if (_listener)
                    _listener.onRemoveEvent(callback);
            },
        }
    }

    private createBroadcastListenerInstancer<Props extends any[], Returns>(name: PropertyKey, withRemovedSolution?: boolean): ListenerController<Props, Returns> {
        // do not call functions from listener controller instances before return.
        return this.createListenerInstance("b_" + name.toString(), withRemovedSolution);
    }

    private async emitAsync(name: PropertyKey, ...params: any[]) {
        const _name = this.tag + name.toString();
        if (!this.events[_name]) this.events[_name] = [];
        if (this.isDebugModeOn) console.info('emit: ' + name.toString() + " execs: " + this.events[_name]?.length);
        if (!this.isExec[_name]) {
            this.isExec[_name] = true;
            await this.events[_name]?.reduce(async (ac, listener) => {
                await ac;
                await !listener.willRemove && listener?.run(...(params as []));
            }, Promise.resolve())
            this.isExec[_name] = false;
            GroupEvent.removeAllHandlers(this.removeEvents);
            if (this.doAfterExec[_name]) {
                this.doAfterExec[_name].forEach(d => d());
            }
            this.doAfterExec[_name] = [];
            this.removeEvents = [];
        }
    }

    private removeEventByName(name: PropertyKey) {
        const _name = this.tag + name.toLocaleString();
        this.events[_name] = [];
        if (!this.isExec[_name]) {
            this.events[_name][0]?.removeEvent();
        } else {
            if (this.doAfterExec[_name]) {
                this.doAfterExec[_name].push(() => this.events[_name][0]?.removeEvent());
            } else {
                this.doAfterExec[_name] = [() => this.events[_name][0]?.removeEvent()];
            }
        }
    }

    private async broadcastEmitAsync<Props extends any[], Returns>(name: PropertyKey, ...params: Props): Promise<Returns[] | undefined> {
        const _name = this.tag + 'b_' + name.toLocaleString();
        if (!this.events[_name]) this.events[_name] = [];
        if (this.isDebugModeOn) console.info('broadcsat emit: ' + name.toString() + " execs: " + this.events[_name]?.length);
        if (!this.isExec[_name]) {
            this.isExec[_name] = true;
            const result = await this.events[_name]?.reduce(async (ac, listener) => {
                const list = await ac;
                if (!listener.willRemove) {
                    let data = (await listener.run(...(params as any[]))) as Returns;
                    list.push(data);
                }
                return list;
            }, Promise.resolve<Returns[]>([]));
            this.isExec[_name] = false;
            GroupEvent.removeAllHandlers(this.removeEvents);
            if (this.doAfterExec[_name]) {
                this.doAfterExec[_name].forEach(d => d());
            }
            this.doAfterExec[_name] = [];
            this.removeEvents = [];
            return result;
        }
    }


    /**
     * Eventos asincronomos 
     * 
     * @param name 
     * @returns 
     */
    createEvent<Name extends PropertyKey>(name: Name) {
        // do not call functions from listener controller instances before return.
        return <Props extends any[]>(withRemovedSolution?: boolean): EventController<Props, Name> => {
            // do not call functions from listener controller instances before return.
            return {
                createListener: () => {
                    // do not call functions from listener controller instances before return.
                    return this.createListenerInstance(name, withRemovedSolution);
                },
                emit: async (...params: Props) => {
                    await this.emitAsync(name, ...params);
                },
                removeEvent: () => {
                    this.removeEventByName(name);
                },
            }
        }
    }

    createBroadcast<Name extends string = string>(name: Name) {
        // do not call functions from listener controller instances before return.
        return <Props extends any[], Returns extends any>(withRemovedSolution?: boolean): EventBrocastController<Props, Returns, Name> => {
            return {
                createBroadcastListener: () => {
                    // do not call functions from listener controller instances before return.
                    return this.createBroadcastListenerInstancer(name, withRemovedSolution);
                },
                broadcastEmit: (...params: Props) => {
                    return this.broadcastEmitAsync(name, ...params);
                },
            }
        }
    }

    /**
     * Eventos para observar una propidad
     * 
     * @param name      * 
     * @returns 
     */
    createObservavble<Name extends string = string>(name: Name) {
        // do not call functions from listener controller instances before return.
        return <T>(defaultValue: T): EventObservableController<T, Name> => {
            const _name = this.tag + "ob_" + name;
            let _value = defaultValue;
            let _subcribers: Record<string, { event: ListenerController<[value: T]> }> = {};
            // do not call functions from listener controller instances before return.
            const ob: EventObservableController<T, Name> = {
                next: async (value, force) => {
                    if (value !== _value || force) {
                        _value = value;
                        await this.emitAsync(_name, _value);
                    }
                    return _value;
                },
                readOnly() {
                    const { get, createSubscriber } = ob;
                    return {
                        get,
                        createSubscriber() {
                            const { subscribe, unsubscribe } = createSubscriber()
                            return {
                                subscribe,
                                get,
                                unsubscribe
                            }
                        },
                    }
                },
                createSubscriber: (name?: string, callback?: (value: T) => Promise<void> | void, noFirstCall?: boolean, doOneTime?: boolean) => {
                    let _listener: ListenerController<[value: T]> | null | undefined = null;

                    const subscribe = (callback: (value: T) => Promise<void> | void, noFirstCall?: boolean, doOneTime?: boolean) => {
                        _listener = name !== undefined ? _subcribers[name]?.event : _listener;
                        const _callback = async (value: T) => {
                            await callback(value);
                            if (doOneTime) {
                                _listener = null;
                                if (name)
                                    delete _subcribers[name];
                            }
                        }
                        if (!_listener) {
                            !noFirstCall && callback(_value);
                            _listener = this.addListener(_name, _callback, doOneTime);
                            if (name && _subcribers[name]) {
                                _subcribers[name] = { event: _listener };
                            }
                            return _listener;
                        } else {
                            _listener.on(_callback, doOneTime);
                            return _listener;
                        }
                    }

                    //it's good call if has reference intance with parent
                    if (typeof callback == "function" && name)
                        subscribe(callback, noFirstCall, doOneTime);
                    else if (typeof callback == "function")
                        throw `'createSubscriber' function needs string param 'name' to save callback`;

                    // do not call functions from listener controller instances before return.
                    return {
                        subscribe,
                        next: async (value, force) => {
                            if (_value !== value || force) {
                                _value = value;
                                await this.emitAsync(_name, _value)
                            }
                            return _value;
                        },
                        unsubscribe() {
                            _listener?.remove();
                            _listener = null;
                            if (name && _subcribers[name]) {
                                delete _subcribers[name];
                            }
                        },
                        get() {
                            return _value;
                        },
                    }
                },
                get() {
                    return _value;
                },
                has(fun) {
                    if (_value !== null && _value !== undefined)
                        fun(_value)
                },
                unsubscribes: () => {
                    this.removeEventByName(_name);
                },
            }
            return ob;
        }


    }


    /**
     * Eventos para cargar una tarea asincronima
     * 
     * @param name Nombre del evento
     * @param task Accion a ejecutar
     * @returns 
     */
    createLoader<Props extends any[], T, Name extends string = string>(name: Name, task: (...props: Props) => Promise<T>): LoaderController<Props, T, Name> {
        const events = new GroupEvent;
        const _loadState = events.createObservavble("_loading")(false);
        const _taskOb = events.createObservavble("_task")<(...props: Props) => Promise<T>>(task);
        const _error = events.createEvent("_error")<[error: any]>(true);
        const _data = events.createEvent("_data")<[T]>(true);

        // do not call functions from listener controller instances before return.
        const laoder: LoaderController<Props, T, Name> = {
            exec: async (...props: Props) => {
                if (!_loadState.get()) {
                    _loadState.next(true);
                    try {
                        const data = await _taskOb.get()(...props);
                        await _data.emit(data);
                        _loadState.next(false);
                        _error.removeEvent();
                        _data.removeEvent();
                        return data
                    } catch (err) {
                        _loadState.next(false);
                        await _error.emit(err);
                        _data.removeEvent();
                        _error.removeEvent();
                        throw err;
                    }
                }
            },
            setTask(callback) {
                _taskOb.next(callback);
                return this;
            },
            isLoading() {
                return _loadState.get();
            },
            listeners: () => ({
                createOnDoneListener() {
                    // do not call functions from listener controller instances before return.
                    return _data.createListener();
                },
                createOnErrorListener() {
                    // do not call functions from listener controller instances before return.
                    return _data.createListener();
                },
            }),
            readOnly: () => ({
                exec: laoder.exec,
                isLoading: laoder.isLoading,
                listeners: laoder.listeners,
            })
        };
        return laoder;
    }


    /**
     * Eventos para ejecutar muliples tareas de forma asincronima
     * @param name 
     * @returns 
     */
    createTasksManager<TKey extends string = string, Name extends string = string>(name: Name) {
        let tasks: Record<string, () => Promise<void>> = {};
        let executing = false;
        let _validators: Record<string, ValidatorController<any> | null> = {};

        const afterLoader = this.createEvent(name + ".afterLoader")();
        const willMountTask = this.createEvent(name + ".willMountTask")<[key: TKey]>();
        const forEachTasksDone = this.createEvent(name + ".foreachTasksDone")<[key: TKey, value: any]>();
        const forEachTasksError = this.createEvent(name + ".foreachTasksErrors")<[key: TKey, error: any]>();
        const startExecution = this.createEvent(name + ".start.exec")();
        const taskLoader: Record<string, LoaderController<[], any>> = {};

        // do not call functions from listener controller instances before taskManager instance return.
        const taskManager: TaskManager<TKey, Name> = {
            addTask: (key, callback) => {
                const events = new GroupEvent;
                taskLoader[key] = events.createLoader(key, callback);
                willMountTask.emit(key);
                tasks[key] = (async () => {
                    taskLoader[key].listeners().createOnErrorListener().on((error) => {
                        forEachTasksError.emit(key, error);
                    });
                    const value = await taskLoader[key].exec();
                    await forEachTasksDone.emit(key, value);
                    delete tasks[key];
                    delete taskLoader[key];
                    const next = Object.values(tasks).shift();
                    if (next && executing) {
                        await next()
                    } else {
                        executing = false
                        await afterLoader.emit();
                    }
                })
                return taskManager;
            },
            execTasks: async () => {
                if (!executing) {
                    executing = true;
                    await startExecution.emit();
                    const task = Object.values(tasks).shift();
                    if (task) {
                        await task();
                    } else {
                        executing = false;
                        await afterLoader.emit();
                    }
                }
            },
            resetTasks() {
                executing = false;
                tasks = {};
            },

            isExecuting() {
                return executing;
            },
            stop() {
                executing = false;
            },
            setTaskValidator(key, validator) {
                // Ftd: validar tareas y emitir eventos importantes!
                _validators[key] = validator;
            },
            listeners: () => ({
                createStartExecutionListener() {
                    // do not call functions from listener controller instances before return.
                    return startExecution.createListener();
                },
                createEndExecutionListener() {
                    // do not call functions from listener controller instances before return.
                    return afterLoader.createListener();
                },
                createForEachAllTaskErrorListener() {
                    // do not call functions from listener controller instances before return.
                    return forEachTasksError.createListener();
                },
                createOnTaskDoneListener: (key) => {
                    let _listener: ListenerController<[any]> | undefined | null;
                    let _willMount: ListenerController<[string]> | undefined;
                    let _callback: ((data: any) => void | Promise<void>) | undefined;
                    let _doOneTime: boolean;

                    const _createInstance: ListenerController<[data: any]>["on"] = (callback, doOneTime) => {
                        _listener = taskLoader[key]?.listeners().createOnDoneListener();
                        if (_listener) {
                            const _removeEventListenerSuper = _listener.remove;
                            _listener.remove = () => {
                                _removeEventListenerSuper();
                                _listener = undefined;
                                _callback = undefined;
                            }
                            _listener.on(async (...params) => {
                                await callback(...params);
                                if (doOneTime) {
                                    _listener = undefined;
                                    _willMount?.remove();
                                    _willMount = undefined;
                                    _callback = undefined;
                                }
                            }, doOneTime);
                        } else {
                            _callback = callback;
                            _doOneTime = doOneTime || false;
                        }
                    }

                    // do not call functions from listener controller instances before return.
                    return {
                        on(callback, doOneTime) {
                            _listener?.remove();
                            if (!_willMount) {
                                _willMount = willMountTask.createListener();
                                _willMount.on((_key) => {
                                    if (key == _key && _callback && _listener != undefined) {
                                        _createInstance(_callback, _doOneTime);
                                    }
                                });
                            }
                            _createInstance(callback, doOneTime);
                        },
                        remove() {
                            _listener?.remove();
                            _willMount?.remove();
                            _willMount = undefined;
                        },
                        get state() {
                            if (_listener == null)
                                return "willAttach";
                            if (_listener == undefined)
                                return "desattached";
                            return _listener.state;
                        },
                        onRemoveEvent(callback) {
                            if (_listener)
                                _listener.onRemoveEvent(callback);
                        },
                    };
                }
            })
        }
        return taskManager;
    }



    /**
     * Eventos para usar en validaciones de formularios.
     * @param name 
     * @param model 
     * @returns 
     */
    createValidator<Model extends object, Name extends string = string>(name: Name): ValidatorController<Model, Name> {
        let _config = { debug: false };
        let _debuger = makeDebuger(_config);
        let _props: Partial<Record<keyof Model, EventObservableController<boolean>>> = {};
        let _taskManager: TaskManager | null = null;
        const _setTaskManager = this.createEvent("setTaskManager." + name)<[taskManager: TaskManager | null]>();
        const _makeValidations = this.createBroadcast("dovalidation." + name)<[], [PropertyKey, boolean]>();
        const _onChange = this.createEvent("on-change." + name)<[key: keyof Model, value: any]>();
        let _model: Model | undefined;

        const addProp = (key: keyof Model, defaultValidationValue?: boolean) => {
            if (!_props[key]) {
                _debuger(`validadion ${name} add prop: ${key.toString()}`);
                _props[key] = this.createObservavble(key.toString() + ".validation")(defaultValidationValue || false);
            }
        }
        // do not call functions from listener controller instances before return.
        return {
            addProp,
            setModel: (model) => {
                Object.values(_props).forEach(d => {
                    (d as EventObservableController<boolean>).unsubscribes();
                })
                _props = {};
                _model = model;
                Object.keys(model).forEach(dk => {
                    addProp(dk as keyof Model);
                })
            },
            setPartialModel(model) {
                _model = _model ? Object.assign(_model, model) : model
                Object.keys(model).forEach(dk => {
                    addProp(dk as keyof Model);
                })
            },
            getEvents() {
                return {
                    listeners: () => ({
                        createOnChangeListener() {
                            return _onChange.createListener();
                        },
                    })
                }
            },
            getProps(key, onChange) {
                return {
                    onChange(value) {
                        if (_props[key]) {
                            _debuger(`validadion ${name} onChange: ${key.toString()}`);
                            _model && (_model[key] = value);
                            const _propV = _props[key];
                            if (_propV)
                                onChange && onChange(value, _propV);
                            _onChange.emit(key, value);
                        }
                    },
                }
            },
            getModel() {
                return _model;
            },
            setDebug(value) {
                _config.debug = value;
            },
            setTaskManager(v) {
                _taskManager = v;
                _setTaskManager.emit(v);
            },
            getTaskManager() {
                return _taskManager;
            },

            async doValidation() {
                const valid = (await _makeValidations.broadcastEmit())?.reduce((ac, d) => {
                    if (!ac)
                        return false;
                    const prop = _props[d[0] as keyof Model];
                    if (prop) {
                        prop.next(d[1]);
                    }
                    return d[1];
                }, true);
                if (valid != undefined)
                    return valid;
                throw "validations is on execution";
            },

            listeners: () => ({
                createSetTaskManagerListener() {
                    return _setTaskManager.createListener();
                },
                createValidationBroadcastListener() {
                    return _makeValidations.createBroadcastListener();
                }
            })
        }
    }

    /**
     * Eventos para ejecutar una tarea despues de cierto tiempo y con un intervalo de tiempo mientras se completa el tiempo.
     * 
     * @param name 
     * @returns 
     */
    createTimer<Name extends string = string>(name: Name): <T extends any[] = any[]>() => TimerController<T, Name> {
        return <T extends any[] = any[]>() => {
            let _delaypass = 0.0;
            let _totalTime = 0.0;
            let _isStopped = true;
            let _isPaused = false;
            const _percent = this.createObservavble("percent_" + name)(0.0);
            const _timer = this.createObservavble("timer_" + name)<any | undefined>(undefined);
            const _completed = this.createEvent("completed_" + name)<T>(true);
            const _stopped = this.createEvent("stopped_" + name)(true);
            const _started = this.createEvent("started_" + name)(true);
            const _paused = this.createEvent("paused_" + name)(true);
            const _running = this.createEvent("running_" + name)<[percent: number, total: number, stopped: boolean]>(true)
            // do not call functions from listener controller instances before return.
            return {
                start(time, per, onCompleted) {
                    const _start = () => {
                        if (!_isPaused && !_isStopped) {
                            _delaypass++;
                            if (_delaypass / _totalTime >= 1) {
                                clearInterval(_timer.get());
                                _timer.next(undefined);
                                (async () => {
                                    await _percent.next(1.0);
                                    const data = await onCompleted() as any;
                                    await _completed.emit(...data);
                                    _completed.removeEvent();
                                    _stopped.removeEvent();
                                    _paused.removeEvent();
                                    _percent.unsubscribes();
                                })();
                            } else {
                                _percent.next(_delaypass / time);
                            }
                        }
                    }
                    if (_isStopped) {
                        _isStopped = false;
                        _percent.next(0.0);
                        _delaypass = 0.0;
                        _totalTime = time;
                        _timer.next(setInterval(_start, per));
                        _started.emit(_percent.get());
                    } else if (_isPaused) {
                        _isPaused = false;
                        _timer.next(setInterval(_start, per));
                        _started.emit(_percent.get());
                    }
                },
                stop() {
                    if (!_isStopped) {
                        _isStopped = true;
                        clearInterval(_timer.get());
                        _timer.next(undefined);
                        (async () => {
                            await _stopped.emit(_percent.get());
                            _completed.removeEvent();
                            _stopped.removeEvent();
                            _percent.unsubscribes();
                        })();
                    }
                },
                pause() {
                    if (!_isPaused && !_isStopped && _timer.get()) {
                        _isPaused = true;
                        clearInterval(_timer.get());
                        _timer.next(undefined);
                        _paused.emit(_percent.get())
                    }
                },
                listeners: () => ({
                    createOnCompletedListener() {
                        return _completed.createListener();
                    },
                    createOnPausedListener() {
                        return _paused.createListener();
                    },
                    createOnRunningListener() {
                        return _running.createListener();
                    },
                    createOnStartedListener() {
                        return _started.createListener();
                    },
                    createOnStoppedListener() {
                        return _stopped.createListener();
                    },
                })

            }
        }

    }


    private static removeAllHandlers(ob: { [x: string]: any } | (ShareEventListener | null)[] | null) {
        if (ob instanceof Array) {
            ob.forEach(event => {
                if (event instanceof ShareEventListener) {
                    event.remove();
                    event = null;
                } else this.removeAllHandlers(event);
            })
        } else if (ob && typeof ob === 'object') {
            this.removeAllHandlers(Object.values(ob));
        }
    }
}


type ObsevavleMapTypeByKey<T, Tkey extends keyof T, TValue extends T[Tkey]> =
    EventObservableController<TValue extends object ?
        (TValue extends null ? TValue :
            (TValue extends undefined ? EventObservableController<TValue, Tkey> : ObservableMapper<TValue>))
        : TValue, Tkey>;

type SubscriberMapControllerByKey<T, Tkey extends keyof T, TValue extends T[Tkey]> =
    SubscriberController<TValue extends object ?
        (TValue extends null ? TValue :
            (TValue extends undefined ? EventObservableController<TValue, Tkey> : ObservableMapper<TValue>))
        : TValue, Tkey>;

export class ObservableMapper<Model> implements EventObservableMapController<Model> {

    private events = new GroupEvent;
    private props: Record<PropertyKey, ObsevavleMapTypeByKey<Model, keyof Model, any>> = {}
    private internalEvents!: GroupEvent;
    private root!: EventObservableController<ObservableMapper<Model>, "root">
    private parent!: ObservableMapper<any>

    constructor(private model?: Model) {

    }

    mount() {
        if (!this.props && this.model) {
            return this.resetFrom(this.model);
        }
    }

    get<Key extends keyof Model, TValue extends Model[Key]>(key: Key): ObsevavleMapTypeByKey<Model, Key, TValue> {
        if (this.props[key]) {
            return (this.props[key] as ObsevavleMapTypeByKey<Model, Key, TValue>)
        }
        let x = undefined as TValue;
        this.props[key] = this.events.createObservavble(key.toString())<TValue>(x);
        return this.props[key];
    }

    getMap<Key extends keyof Model, TValue extends Model[Key]>(key: Key): ObservableMapper<TValue> {
        if (this.props[key]) {
            const map = this.props[key].get();
            if (map instanceof ObservableMapper) {
                return map;
            }
        }
        let deep = new ObservableMapper<TValue>
        this.props[key] = this.events.createObservavble(key.toString())(deep);
        return this.props[key].get() as ObservableMapper<TValue>;
    }

    createSubscriber<Key extends keyof Model, TValue extends Model[Key]>(key: Key): SubscriberMapControllerByKey<Model, Key, TValue> {
        return this.get(key).createSubscriber() as SubscriberMapControllerByKey<Model, Key, TValue>;
    }

    getModel() {
        return this.model;
    }

    resetFrom(model: Model): EventObservableMapController<Model> {
        if (model) {
            this.model = model;
            if (!this.parent) {
                this.internalEvents = new GroupEvent;
                this.root = this.internalEvents.createObservavble("root")<ObservableMapper<Model>>(this);
            }
        }
        //todo
        if (typeof model == "object" && !Array.isArray(model) && model) {
            const keys = Object.keys(model);
            for (let vk of keys) {
                const m: any = model;
                const value = m[vk];
                if (typeof value == "object" && !Array.isArray(value) && value) {
                    const deep = new ObservableMapper<any>;
                    deep.parent = this;
                    deep.resetFrom(value);
                    this.props[vk] = this.events.createObservavble(vk)(deep);
                    this.props[vk].createSubscriber().subscribe(value => {
                        (model as any)[vk] = value;
                    })
                } else {
                    this.props[vk] = this.events.createObservavble(vk)<any>(value);
                    this.props[vk].createSubscriber().subscribe(value => {
                        (model as any)[vk] = value;
                    })
                }
            }
        }
        return this;
    }

    update(force?: boolean) {
        if (this.props && typeof this.model == "object" && !Array.isArray(this.model) && this.model) {
            const keys = Object.keys(this.model);
            for (let vk of keys) {
                const m: any = this.model;
                const value = m[vk];
                if (typeof value == "object" && !Array.isArray(value) && value) {
                    this.getMap(vk as keyof Model)?.update(force);
                } else {
                    this.props[vk].next(value, force);
                }
            }
        }
    }


    //todo mejorar esto, tiene que aactualizar el arbol.
    updateFrom(model: Model, force?: boolean) {
        if (this.props && typeof this.model == "object" && !Array.isArray(this.model) && model) {
            const keys = Object.keys(model);
            for (let vk of keys) {
                const m: any = model;
                const value = m[vk];
                if (typeof value == "object" && !Array.isArray(value) && value) {
                    this.getMap(vk as keyof Model)?.updateFrom(value, force);
                } else {
                    this.props[vk].next(value, force);
                }
            }
        }
    }
}