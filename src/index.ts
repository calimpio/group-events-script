// v: 2.1.2
// Ftd: (Feactures to dev)


// Ftd: Reducir el uso de llaves string para los escuchadores lo que mas se pueda.

export type ListenerController<Props extends any[], Returns = Promise<void> | void> = {
    /**
     * Modificar el escuchador del evento. 
     * 
     * @param callback se ejecuta cuando se emite el evento.
     */
    on(callback: (...props: Props) => Returns, doOneTime?: boolean): void
    /**
     * Eliminar el escuchador del evento
     */
    removeEventListener(): void
}

export type EventBrocastController<Props extends any[], Returns> = {
    addBroadcastListener: (callback: (...parmas: Props) => Returns) => ListenerController<Props, Returns>;
    addUniqueBroadcastListener: (key: string, callback: (...parmas: Props) => Returns, doOneTime?: boolean) => void;
    broadcastEmit: (...params: Props) => Returns[];
    removeUniqueBroadcastListener(key: string): void
    createBroadcastListenerInstance(): ListenerController<Props, Returns>
}

export type EventBrocastControllerAsync<Props extends any[], Returns> = {
    addBroadcastListenerAsync: (callback: (...parmas: Props) => Returns) => ListenerController<Props, Promise<Returns> | Returns>;
    broadcastEmitAsync: (...params: Props) => Promise<Returns[]>;
    createBroadcastListenerInstance(): ListenerController<Props, Promise<Returns> | Returns>
}

export type EventController<Props extends any[]> = {
    addListener: (callback: (...parmas: Props) => void, doOneTime?: boolean) => ListenerController<Props, void>;
    emit: (...params: Props) => void;
}

export type EventControllerAsync<Props extends any[] = []> = {
    /**
     * Añadir un escuchador a una lista del evento que espera a que se emita.
     * 
     * @param callback 
     * @param doOneTime 
     * @returns 
     */
    addListenerAsync: (callback: (...parmas: Props) => any, doOneTime?: boolean) => ListenerController<Props>;
    /**
     * Emitir evento
     * 
     * @param params 
     * @returns 
     */
    emitAsync: (...params: Props) => Promise<void>;
    /**
     * Crear escuchador unico. Cuando se quiere implementar en las vistas
     * 
     * @param key 
     * @param callback 
     * @param doOneTime 
     * @returns 
     */
    addUniqueListenerAsync: (key: string, callback: (...parmas: Props) => any, doOneTime?: boolean) => ListenerController<Props>;
    /**
     * Borrar escuchador unico
     * @param key 
     */
    deleteUniqueListener(key: string): void
    /**
     * Borrar todos los escucahdores
     */
    removeAllEvents(): void
    /**
     * Crear un unico escuchador en el evento. Implementar en los estados de React.
     */
    createListenerInstance(): ListenerController<Props>
}

export type EventObservableControllerAsync<T> = {
    /**
     * Nombre del evento
     */
    name: string,
    /**
     * Observar al moemnto de modificar el valor. Añade un escuchador al evento.
     * @param callback 
     * @returns 
     */
    subscribe: (callback: (value: T) => any, noFirstCall?: boolean, doOneTime?: boolean) => ListenerController<[value: T]>;
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
    createSubscriber: (key?: string, callback?: (value: T) => Promise<void> | void, noFirstCall?: boolean, doOneTime?: boolean) => SubscriberController<T>
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
}

export interface SubscriberController<T> {
    /**
     * Subcribirse al evento unico. Cuando se quiere observar al moemnto de modificar el valor desde las vistas.
     * @param callback 
     * @param noFirstCall 
     * @returns 
     */
    subscribe: (callback: (value: T) => Promise<void> | void, noFirstCall?: boolean, doOneTime?: boolean) => ListenerController<[value: T]>;
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

export interface ValidatorController<Model> {
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
    getProps(key: keyof Model, onChange?: (value: any, valid: EventObservableControllerAsync<boolean>) => void): FormProps
    /**
     * Obetener los escuchadores para las acciones
     */
    getEvents(): FormEventsController<Model>
    /**
     * Obtener el modelo
     */
    getModel(): Model | undefined

    /**
     * Ejecutar validaciones
     */
    doValidation(): Promise<boolean>

    setDebug(value: boolean): void
    setTaskManager(v: TaskManager | null): void
    getTaskManager(): TaskManager | null
    listeners: {
        createSetTaskManagerListener(): ListenerController<[taskManager: TaskManager | null]>
        /**
         * Devolver validaciones de los campos del modelo
         */
        createValidationBroadcastListener(): ListenerController<[], [PropertyKey, boolean]>
    }
}

export interface FormEventsController<Model> {

    listeners: {
        /**
         * Crear escuchador unico para cuando se valide
         * @param id 
         * @param callback 
         */
        createOnValidListener(): ListenerController<[value: boolean]>
        /**
        * Crear escuchador unico para cuando se modifiquen las propiedades
        * @param id 
        * @param callback 
        */
        createOnChangeListener(): ListenerController<[key: keyof Model, value: any]>
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

export interface LoaderController<Props extends any[], T> {
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
     * Modificar el evento tarea terminada.
     * Se usa cuando la vista esta esperando que carga pero el hook se actualiza y hay que actualizar los estados.
     * 
     * Modo de una tarea a una vista
     * @param callback Respuesta de la tarea
     */
    setOnDone(callback: (data: T) => void): void
    /**
     * Modificar un evento de tarea temininada la tarea por llave unica.
     * Se usa cuando la vista esta esperando que carga pero el hook se actualiza y hay que actualizar los estados de muchas vistas.
     * 
     * De una tarea a muchas vistas
     * @param key Llave unica para evneto cuando terminó la tarea
     * @param callback Respuesta de la tarea
     */
    setUniqueOnDone(key: string, callback: (data: T) => void): void
    /**
     * Modifica la tarea del cargador sin ejecutarla
     * @param callback 
     */
    setTask(callback: (...props: Props) => Promise<T>): LoaderController<Props, T>
    setOnError(callback: (error: any) => void): void
    setUniqueOnError(key: string, callback: (error: any) => void): void
    listeners: {
        /**
         * Crear escuchador para cuando termine la tarea
         */
        createOnDoneListener(): ListenerController<[T]>
    }
}

export interface TaskManager<TKey = string> {
    addTask(key: TKey, fun: () => Promise<any>): TaskManager<TKey>
    execTasks(): Promise<void>
    resetTasks(): void
    isExecuting(): boolean
    stop(): void
    setTaskValidator(key: TKey, validator: ValidatorController<any> | null): void
    listeners: {
        createStartExecutionListener(): ListenerController<[]>
        createEndExecutionListener(): ListenerController<[]>
        createForEachAllTaskErrorListener(): ListenerController<[key: TKey, error: any]>
        createOnTaskDoneListener(key: TKey): ListenerController<[data: any]> | undefined
    }
}

export interface TimerController<CompleteParams extends any[] = any[]> {
    start(time: number, per: number, resolve: () => CompleteParams): void
    stop(): void
    pause(): void
    onStarted(key: string, callback: (percent: number) => void): void
    onPaused(key: string, callback: (percent: number) => void): void
    onRunning(key: string, callback: (percent: number, total: number, stopped: boolean) => void): void
    onStopped(key: string, callback: (percent: number) => void): void
    onCompleted(key: string, callback: (...params: CompleteParams) => void): void
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
        if (this.doOneTime) {
            this.event.doAfterExec[this.name].push(this.removeEventListener);
        }
        return this.handler(...props)
    }

    on(callback: (...props: Props) => Returns, doOneTime?: boolean): void {
        this.handler = callback;
        this.doOneTime = doOneTime || false;
        if (this.removed) {
            throw new Error("it's setting a listener that was removed");
        }
    }

    removeEventListener() {
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

    createController(): ListenerController<Props, Returns> {
        return {
            on: (callback, doOneTime) => {
                this.on(callback, doOneTime);
            },
            removeEventListener: () => {
                this.removeEventListener();
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


    private addListener<Props extends any[], Returns>(name: string, callback: (...params: Props) => Returns, doOneTime?: boolean) {
        const _name = this.tag + name;
        if (this.isDebugModeOn) console.info('add event: ' + name);
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

    private emit(name: string, ...params: any[]) {
        const _name = this.tag + name;
        if (!this.events[_name]) this.events[_name] = [];
        if (this.isDebugModeOn) console.info('emit: ' + name + " execs: " + this.events[_name]?.length);
        this.isExec[_name] = true;
        this.events[_name]?.forEach((listener) => {
            if (params instanceof Array && !listener.willRemove)
                listener?.run(...(params as []));
        })
        this.isExec[_name] = false;
        GroupEvent.removeAllHandlers(this.removeEvents);
        if (this.doAfterExec[_name]) {
            this.doAfterExec[_name].forEach(d => d());
        }
        this.doAfterExec[_name] = [];
        this.removeEvents = [];
    }

    private createListenerInstancer<Props extends any[], Returns>(name: string): ListenerController<Props, Returns> {
        let listener: ListenerController<Props, Returns> | null = null;
        // do not call functions from listener controller instances before return.
        return {
            on: (callback, doOneTime) => {
                const _callback: (...prams: Props) => Returns = (...params) => {
                    if (doOneTime) {
                        listener = null;
                    }
                    return callback(...params);
                }
                listener ? listener.on(_callback, doOneTime) : (listener = this.addListener(name, _callback, doOneTime));

            },
            removeEventListener: () => {
                listener?.removeEventListener();
                listener = null;
            },
        }
    }

    private createBroadcastListenerInstancer<Props extends any[], Returns>(name: string): ListenerController<Props, Returns> {
        // do not call functions from listener controller instances before return.
        return this.createListenerInstancer("b_" + name);
    }

    private async emitAsync(name: string, ...params: any[]) {
        const _name = this.tag + name;
        if (!this.events[_name]) this.events[_name] = [];
        if (this.isDebugModeOn) console.info('emit: ' + name + " execs: " + this.events[_name]?.length);
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

    private removeEventByName(name: string) {
        const _name = this.tag + name;
        this.events[_name] = [];
        if (!this.isExec[_name]) {
            this.events[_name] = [];
        } else {
            if (this.doAfterExec[_name]) {
                this.doAfterExec[_name].push(() => this.events[_name] = []);
            } else {
                this.doAfterExec[_name] = [() => this.events[_name] = []];
            }
        }
    }

    private addBroadcastListener(name: string, handler: (...params: any[]) => any, doOneTime?: boolean) {
        return this.addListener('b_' + name, handler, doOneTime);
    }


    private broadcastEmit<Props extends [], Returns>(name: string, ...params: Props): Returns[] {
        const _name = this.tag + 'b_' + name;
        if (!this.events[_name]) this.events[_name] = [];
        if (this.isDebugModeOn) console.info('broadcsat emit: ' + name + " execs: " + this.events[_name]?.length);
        this.isExec[_name] = true;
        const result = this.events[_name]?.map((listener) => {
            return !listener.willRemove && listener.run(...(params as []));
        }) as Returns[];
        this.isExec[_name] = false;
        GroupEvent.removeAllHandlers(this.removeEvents);
        if (this.doAfterExec[_name]) {
            this.doAfterExec[_name].forEach(d => d());
        }
        this.doAfterExec[_name] = [];
        this.removeEvents = [];
        return result;
    }

    private async broadcastEmitAsync<Props extends [], Returns>(name: string, ...params: Props): Promise<Returns[]> {
        const _name = this.tag + 'b_' + name;
        if (!this.events[_name]) this.events[_name] = [];
        if (this.isDebugModeOn) console.info('broadcsat emit: ' + name + " execs: " + this.events[_name]?.length);
        this.isExec[_name] = true;
        const result = await this.events[_name]?.reduce(async (ac, listener) => {
            const list = await ac;
            if (!listener.willRemove) {
                let data = (await listener.run(...(params as []))) as Returns;
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



    createController<Props extends any[]>(name: string) {
        // do not call functions from listener controller instances before return.
        return <EventController<Props>>{
            addListener: (callback: (...parmas: Props) => void) => {
                return this.addListener(name, callback as any);
            },
            emit: (...params: Props) => {
                this.emit(name, ...params);
            },
        }
    }

    /**
     * Eventos asincronomos 
     * 
     * @param name 
     * @returns 
     */
    createControllerAsync<Props extends any[]>(name: string): EventControllerAsync<Props> {
        const eventsKeys: Record<string, { listener: ListenerController<Props, void> }> = {};
        // do not call functions from listener controller instances before return.
        return {
            addListenerAsync: (callback: (...parmas: Props) => Promise<void>, doOneTime) => {
                return this.addListener(name, callback as any, doOneTime);
            },
            emitAsync: async (...params: Props) => {
                await this.emitAsync(name, ...params);
            },
            addUniqueListenerAsync: (key, callback, doOneTime) => {
                if (!eventsKeys[key]) {
                    eventsKeys[key] = {
                        listener: this.createListenerInstancer(name)
                    };
                }
                eventsKeys[key].listener.on(async (...params: Props) => {
                    await callback(...params);
                    if (doOneTime) {
                        delete eventsKeys[key];
                    }
                }, doOneTime);
                return eventsKeys[key].listener;
            },
            deleteUniqueListener(key: string) {
                if (eventsKeys[key]) {
                    eventsKeys[key].listener.removeEventListener();
                    delete eventsKeys[key];
                }
            },
            removeAllEvents: () => {
                this.removeEventByName(name);
            },
            createListenerInstance: () => {
                // do not call functions from listener controller instances before return.
                return this.createListenerInstancer(name);
            },
        }
    }


    createBroadcastController<Props extends [], Returns extends any>(name: string): EventBrocastController<Props, Returns> {
        const eventsKeys: Record<string, { listener: ListenerController<Props, Returns> }> = {};
        // do not call functions from listener controller instances before return.
        return {
            addBroadcastListener: (callback: (...parmas: Props) => Returns) => {
                return this.addBroadcastListener(name, callback);
            },

            addUniqueBroadcastListener: (key, callback, doOneTime) => {
                if (eventsKeys[key]) {
                    eventsKeys[key].listener.on((...params: Props) => {
                        if (doOneTime) {
                            delete eventsKeys[key];
                        }
                        return callback(...params);
                    }, doOneTime);
                } else {
                    eventsKeys[key] = {
                        listener: this.addBroadcastListener(name, (...params: Props) => {
                            if (doOneTime) {
                                delete eventsKeys[key];
                            }
                            return callback(...params);
                        }, doOneTime),
                    };
                }
            },

            broadcastEmit: (...params: Props) => {
                return this.broadcastEmit(name, ...params);
            },
            removeUniqueBroadcastListener(key) {
                if (eventsKeys[key]) {
                    eventsKeys[key].listener.removeEventListener();
                    delete eventsKeys[key];
                }
            },
            createBroadcastListenerInstance: () => {
                // do not call functions from listener controller instances before return.
                return this.createBroadcastListenerInstancer(name);
            },
        }
    }

    createBroadcastControllerAsync<Props extends [], Returns extends any>(name: string): EventBrocastControllerAsync<Props, Returns> {
        // do not call functions from listener controller instances before return.
        return {
            addBroadcastListenerAsync: (callback: (...parmas: Props) => Returns) => {
                return this.addBroadcastListener(name, callback);
            },

            broadcastEmitAsync: (...params: Props) => {
                return this.broadcastEmitAsync(name, ...params);
            },

            createBroadcastListenerInstance: () => {
                // do not call functions from listener controller instances before return.
                return this.createBroadcastListenerInstancer(name);
            },
        }
    }

    /**
     * Eventos para observar una propidad
     * 
     * @param name 
     * @param defaultValue 
     * @returns 
     */
    createObservavbleControllerAsync<T>(name: string, defaultValue: T): EventObservableControllerAsync<T> {
        const _name = this.tag + "ob_" + name;
        let _value = defaultValue;
        let _subcribers: Record<string, { event: ListenerController<[value: T]> }> = {};
        // do not call functions from listener controller instances before return.
        return {
            name,
            subscribe: (callback, noFirstCall?: boolean, doOneTime?: boolean) => {
                !noFirstCall && callback(_value);
                return this.addListener(_name, callback, doOneTime);
            },
            next: async (value, force) => {
                if (value !== _value || force) {
                    _value = value;
                    await this.emitAsync(_name, _value);
                }
                return _value;
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
                        _listener?.removeEventListener();
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
    }


    /**
     * Eventos para cargar una tarea asincronima
     * 
     * @param name Nombre del evento
     * @param task Accion a ejecutar
     * @returns 
     */
    createLoader<Props extends any[], T>(name: string, task: (...props: Props) => Promise<T>): LoaderController<Props, T> {
        const loadState = this.createObservavbleControllerAsync<boolean>(name + "_loading", false);
        const taskOb = this.createObservavbleControllerAsync<(...props: Props) => Promise<T>>(name + "_task", task);
        const done = this.createObservavbleControllerAsync<((v: T) => void) | null>(name + "_done", null);
        const error = this.createObservavbleControllerAsync<((v: any) => void) | null>(name + "_error", null);
        const uDone = this.createObservavbleControllerAsync<Record<string, ((v: T) => void)>>(name + "_udone", {});
        const uError = this.createObservavbleControllerAsync<Record<string, ((v: any) => void)>>(name + "_uerror", {});
        const _data = this.createControllerAsync<[T]>(name + "_data");
        // do not call functions from listener controller instances before return.
        return {
            exec: async (...props: Props) => {
                if (!loadState.get()) {
                    loadState.next(true);
                    try {
                        const data = await taskOb.get()(...props);
                        await _data.emitAsync(data);
                        const before = done.get();
                        const dones = uDone.get();
                        before && before(data);
                        loadState.next(false);
                        Object.values(dones).forEach(d => d(data));
                        uDone.next({});
                        error.next(null);
                        uError.next({});
                        uDone.next({});
                        done.next(null);
                        return data
                    } catch (err) {
                        loadState.next(false);
                        const before = error.get();
                        const dones = uError.get();
                        before && before(err);
                        Object.values(dones).forEach(d => d(err));
                        error.next(null);
                        uError.next({});
                        uDone.next({});
                        done.next(null);
                        throw err;
                    }
                }
            },
            setTask(callback) {
                taskOb.next(callback);
                return this;
            },
            isLoading() {
                return loadState.get();
            },
            setOnDone(callback) {
                done.next((value) => callback(value));
            },
            setOnError(callback) {
                error.next((value) => callback(value));
            },
            setUniqueOnDone(key, callback) {
                const dones = uDone.get();
                dones[key] = callback;
                uDone.next(dones);
            },
            setUniqueOnError(key, callback) {
                const errors = uError.get();
                errors[key] = callback;
                uError.next(errors);
            },
            listeners: {
                createOnDoneListener() {
                    // do not call functions from listener controller instances before return.
                    return _data.createListenerInstance()
                }
            }
        };
    }


    /**
     * Eventos para ejecutar muliples tareas de forma asincronima
     * @param name 
     * @returns 
     */
    createTasksManager<TKey extends string = string>(name: string) {
        let tasks: Record<string, () => Promise<void>> = {};
        let executing = false;
        let _validators: Record<string, ValidatorController<any> | null> = {};

        const afterLoader = this.createControllerAsync<[]>(name + ".afterLoader");
        const willMountTask = this.createControllerAsync<[key: TKey]>(name + ".willMountTask");
        const forEachTasksDone = this.createControllerAsync<[key: TKey, value: any]>(name + ".foreachTasksDone");
        const forEachTasksError = this.createControllerAsync<[key: TKey, error: any]>(name + ".foreachTasksErrors");
        const startExecution = this.createControllerAsync(name + ".start.exec");
        const taskLoader: Record<string, LoaderController<[], any>> = {};


        // do not call functions from listener controller instances before taskManager instance return.
        const taskManager: TaskManager<TKey> = {
            addTask: (key, callback) => {
                const events = new GroupEvent;
                taskLoader[key] = events.createLoader(key, callback);
                willMountTask.emitAsync(key);
                tasks[key] = (async () => {
                    taskLoader[key].setOnError((error) => {
                        forEachTasksError.emitAsync(key, error);
                    });
                    const value = await taskLoader[key].exec();
                    await forEachTasksDone.emitAsync(key, value);
                    delete tasks[key];
                    delete taskLoader[key];
                    const next = Object.values(tasks).shift();
                    if (next && executing) {
                        await next()
                    } else {
                        executing = false
                        await afterLoader.emitAsync();
                    }
                })
                return taskManager;
            },
            execTasks: async () => {
                if (!executing) {
                    executing = true;
                    await startExecution.emitAsync();
                    const task = Object.values(tasks).shift();
                    if (task) {
                        await task();
                    } else {
                        executing = false;
                        await afterLoader.emitAsync();
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
            listeners: {
                createStartExecutionListener() {
                    // do not call functions from listener controller instances before return.
                    return startExecution.createListenerInstance();
                },
                createEndExecutionListener() {
                    // do not call functions from listener controller instances before return.
                    return afterLoader.createListenerInstance();
                },
                createForEachAllTaskErrorListener() {
                    // do not call functions from listener controller instances before return.
                    return forEachTasksError.createListenerInstance();
                },
                createOnTaskDoneListener: (key) => {
                    let _listener: ListenerController<[any]> | undefined;
                    let _willMount: ListenerController<[string]> | undefined;
                    let _callback: ((data: any) => void | Promise<void>) | undefined;
                    let _doOneTime: boolean;

                    const _createInstance: ListenerController<[data: any]>["on"] = (callback, doOneTime) => {
                        _listener = taskLoader[key]?.listeners.createOnDoneListener();
                        if (_listener) {
                            const _removeEventListenerSuper = _listener.removeEventListener;
                            _listener.removeEventListener = () => {
                                _removeEventListenerSuper();
                                _listener = undefined;
                                _callback = undefined;
                            }
                            _listener.on(async (...params) => {
                                await callback(...params);
                                if (doOneTime) {
                                    _listener = undefined;
                                    _willMount?.removeEventListener();
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
                            _listener?.removeEventListener();
                            if (!_willMount) {
                                _willMount = willMountTask.createListenerInstance();
                                _willMount.on((_key) => {
                                    if (key == _key && _callback) {
                                        _createInstance(_callback, _doOneTime);
                                    }
                                });
                            }
                            _createInstance(callback, doOneTime);
                        },
                        removeEventListener() {
                            _listener?.removeEventListener();
                            _willMount?.removeEventListener();
                            _willMount = undefined;
                        },
                    };
                }
            }
        }
        return taskManager;
    }



    /**
     * Eventos para usar en validaciones de formularios.
     * @param name 
     * @param model 
     * @returns 
     */
    createValidator<Model extends object>(name: string): ValidatorController<Model> {
        let _config = { debug: false };
        let _debuger = makeDebuger(_config);
        let _props: Partial<Record<keyof Model, EventObservableControllerAsync<boolean>>> = {};
        let _taskManager: TaskManager | null = null;
        const _onValid = this.createControllerAsync<[value: boolean]>("onValid." + name);
        const _setTaskManager = this.createControllerAsync<[taskManager: TaskManager | null]>("setTaskManager." + name);
        const _makeValidations = this.createBroadcastControllerAsync<[], [PropertyKey, boolean]>("dovalidation." + name);
        const _onChange = this.createControllerAsync<[key: keyof Model, value: any]>("on-change." + name);
        let _model: Model | undefined;

        const addProp = (key: keyof Model, defaultValidationValue?: boolean) => {
            if (!_props[key]) {
                _debuger(`validadion ${name} add prop: ${key.toString()}`);
                _props[key] = this.createObservavbleControllerAsync(key.toString() + ".validation", defaultValidationValue || false);
            }
        }
        // do not call functions from listener controller instances before return.
        return {
            addProp,
            setModel: (model) => {
                Object.values(_props).forEach(d => {
                    (d as EventObservableControllerAsync<boolean>).unsubscribes();
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
                    listeners: {
                        createOnChangeListener() {
                            return _onChange.createListenerInstance();
                        },
                        createOnValidListener() {
                            return _onValid.createListenerInstance();
                        },
                    }
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
                            _onChange.emitAsync(key, value);
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
                _setTaskManager.emitAsync(v);
            },
            getTaskManager() {
                return _taskManager;
            },

            async doValidation() {
                const valid = (await _makeValidations.broadcastEmitAsync()).reduce((ac, d) => {
                    if (!ac)
                        return false;
                    const prop = _props[d[0] as keyof Model];
                    if (prop) {
                        prop.next(d[1]);
                    }
                    return d[1];
                }, true);
                return valid;
            },

            listeners: {
                createSetTaskManagerListener() {
                    return _setTaskManager.createListenerInstance();
                },
                createValidationBroadcastListener() {
                    return _makeValidations.createBroadcastListenerInstance();
                }
            }
        }
    }

    /**
     * Eventos para ejecutar una tarea despues de cierto tiempo y con un intervalo de tiempo mientras se completa el tiempo.
     * 
     * @param name 
     * @returns 
     */
    createTimer<T extends any[] = any[]>(name: string): TimerController<T> {
        let _delaypass = 0.0;
        let _totalTime = 0.0;
        let _isStopped = true;
        let _isPaused = false;
        const _percent = this.createObservavbleControllerAsync("percent_" + name, 0.0);
        const _timer = this.createObservavbleControllerAsync<number | undefined>("timer_" + name, undefined);
        const _completed = this.createControllerAsync<T>("completed_" + name);
        const _stopped = this.createControllerAsync("stopped_" + name);
        const _started = this.createControllerAsync("started_" + name);
        const _paused = this.createControllerAsync("paused_" + name);
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
                                const data = await onCompleted();
                                await _completed.emitAsync(...data);
                                _completed.removeAllEvents();
                                _stopped.removeAllEvents();
                                _paused.removeAllEvents();
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
                    _started.emitAsync(_percent.get());
                } else if (_isPaused) {
                    _isPaused = false;
                    _timer.next(setInterval(_start, per));
                    _started.emitAsync(_percent.get());
                }
            },
            stop() {
                if (!_isStopped) {
                    _isStopped = true;
                    clearInterval(_timer.get());
                    _timer.next(undefined);
                    (async () => {
                        await _stopped.emitAsync(_percent.get());
                        _completed.removeAllEvents();
                        _stopped.removeAllEvents();
                        _percent.unsubscribes();
                    })();
                }
            },
            onRunning(key, callback) {
                const _sub = _percent.createSubscriber(key);
                _sub.subscribe((percent) => {
                    callback(percent, _totalTime, !_timer.get())
                })
            },
            onCompleted(key, callback) {
                _completed.addUniqueListenerAsync(key, callback);
            },
            onStopped(key, callback) {
                _stopped.addUniqueListenerAsync(key, callback);
            },
            onPaused(key, callback) {
                _paused.addUniqueListenerAsync(key, callback);
            },
            onStarted(key, callback) {
                _started.addUniqueListenerAsync(key, callback);
            },
            pause() {
                if (!_isPaused && !_isStopped && _timer.get()) {
                    _isPaused = true;
                    clearInterval(_timer.get());
                    _timer.next(undefined);
                    _stopped.emitAsync(_percent.get());
                }
            },
        }
    }


    private static removeAllHandlers(ob: { [x: string]: any } | (ShareEventListener | null)[] | null) {
        if (ob instanceof Array) {
            ob.forEach(event => {
                if (event instanceof ShareEventListener) {
                    event.removeEventListener();
                    event = null;
                } else this.removeAllHandlers(event);
            })
        } else if (ob && typeof ob === 'object') {
            this.removeAllHandlers(Object.values(ob));
        }
    }
}