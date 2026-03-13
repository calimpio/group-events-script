import { useEffect, useState } from "react";
import { EventBroadcastController, EventController, eventer, EventObservableController, SubscriberController, ValidatorController } from "./index";


type ObservableOrSubscriberFunctionInstancer<T> = EventObservableController<T> |
    EventObservableController<T>["createSubscriber"] |
    undefined;

type EventOrBroadcastOrListenerFunctionInstancer<Props extends any[], Returns> =
    EventController<Props> | EventController<Props>["createListener"] |
    EventBroadcastController<Props, Returns> |
    EventBroadcastController<Props, Returns>["createBroadcastListener"] |
    undefined;

/**
 * Observar el conetenido de un EventObservableController o Subscriber
 * @param observable 
 * @param callback2 funcion adicional si se desea 
 * @returns 
 * @description Se va usar ahora es `useSuscriber`
 */
export function useObservable<T>(observable?: ObservableOrSubscriberFunctionInstancer<T>, callback2?: (v: T) => void):
    [ObservableOrSubscriberFunctionInstancer<T> extends undefined ? unknown : T, ObservableOrSubscriberFunctionInstancer<T> extends undefined ? undefined : SubscriberController<T, string>, boolean] {
    const [subscriber] = useState(typeof observable == "function" && observable() || (observable as EventObservableController<T> | undefined)?.createSubscriber());
    const [subscriber2] = useState(callback2 ? (typeof observable == "function" && observable() || (observable as EventObservableController<T> | undefined)?.createSubscriber()) : undefined);
    const state = useState(false);
    const react = subscriber?.react();
    useEffect(() => react?.updateEffect(state)(), [state[0]]);
    useEffect(() => { callback2 && subscriber2?.subscribe(callback2); return () => callback2 && subscriber2?.unsubscribe() }, []);
    const value = subscriber?.get() as ObservableOrSubscriberFunctionInstancer<T> extends undefined ? unknown : T;
    const subs = subscriber as ObservableOrSubscriberFunctionInstancer<T> extends undefined ? undefined : SubscriberController<T, string>
    return [value, subs, state[0]]
}

/**
 * Crea un susbcriptor para escuchar si el contenido de un observador al modifcarse sin re renderizar la vista
 * @param observable 
 * @param callback2 funcion adicional si se desea 
 * @returns 
 */
export function useSubscriber<T>(observable?: ObservableOrSubscriberFunctionInstancer<T>, callback2?: (v: T) => void):
    [ObservableOrSubscriberFunctionInstancer<T> extends undefined ? undefined : SubscriberController<T, string>] {
    const [subscriber] = useState(typeof observable == "function" && observable() || (observable as EventObservableController<T> | undefined)?.createSubscriber());
    const [subscriber2] = useState(callback2 ? (typeof observable == "function" && observable() || (observable as EventObservableController<T> | undefined)?.createSubscriber()) : undefined);
    useEffect(() => { callback2 && subscriber2?.subscribe(callback2); return () => callback2 && subscriber2?.unsubscribe() }, []);
    const subs = subscriber as ObservableOrSubscriberFunctionInstancer<T> extends undefined ? undefined : SubscriberController<T, string>
    return [subs]
}

/**
 * 
 * @param observable 
 * @returns 
 * @description se va usar ahora `useSubscriberData`
 */
export function useObservableData<T>(observable?: ObservableOrSubscriberFunctionInstancer<T>):
    [T | undefined, (value: T, force?: boolean) => void] {
    const [value, setValue] = useState<T | undefined>()
    const [, subscriber] = useObservable(observable, (v) => {
        setValue(() => v);
    });
    return [value, subscriber?.next]
}


/**
 * Obtener el valor del observable renderizando la vista en cada cambio.
 * @param observable 
 * @returns 
 */
export function useSubscriberData<T>(observable?: ObservableOrSubscriberFunctionInstancer<T>):
    [T | undefined, SubscriberController<T, string>] {
    const [value, setValue] = useState<[T] | undefined>()
    const [subscriber] = useSubscriber(observable, (v) => {
        setValue(() => [v]);
    });

    return [value?.[0], subscriber]
}


/**
 * Escuchar Evento o Brocast de Evento o un escuchador
 * @param event 
 * @param callback 
 * @returns 
 */
export function useListener<Props extends any[], Returns>(
    event: EventOrBroadcastOrListenerFunctionInstancer<Props, Returns>,
    callback?: (...props: Props) => EventOrBroadcastOrListenerFunctionInstancer<Props, Returns> extends EventBroadcastController<Props, Returns> ? Promise<Returns> :
        EventOrBroadcastOrListenerFunctionInstancer<Props, Returns> extends EventBroadcastController<Props, Returns>["createBroadcastListener"] ? Promise<Returns> : void) {
    const [listener] = useState(typeof event == "function" && event() || (event as EventController<Props>)?.createListener());
    useEffect(() => { (listener as any)?.on(callback); return () => listener?.remove(); }, [])
    return null;
}


const events = eventer();
const taskManager = events.createTasksManager("global-task-manage");

/**
 * Administrador global de tareas asyncronimas
 * @returns 
 */
export function useGlobalTaskManager() {
    return taskManager;
}

/**
 * Crear una tarea asincronima, se ejecuta desde administrador global de tareas
 * @param callback 
 * @returns 
 */
export function useTask(callback: () => Promise<void>, execute?: boolean) {
    const [task] = useState(taskManager.createTaskInstance());
    useEffect(() => {
        task.setTask(callback);
        execute && taskManager.execTasks();
        return () => {
            task.remove();
        }
    }, [])
    return taskManager;
}

/**
 * Crear validador
 * @param model 
 * @param buildValidator si es `false` no se crea en validador por defecto está en `true`
 * @returns 
 */
export function useValidator<T extends object>(model?: T, buildValidator: boolean = true): [ValidatorController<T> | undefined, T | undefined] {
    const [events] = useState(eventer());
    const [validator] = useState((buildValidator && events.createValidator<T>("validator"))|| undefined);
    useEffect(() => {
        model && validator?.setModel(model);
    }, [model])
    return [validator, model];
}

/**
 * Crear un validador con un modelo
 * @param model  
 * @returns 
 */
export function useValidatorModel<T extends object>(model: T): [ValidatorController<T>, T] {
    const [validator] = useValidator<T>(model);
    const [model2] = useState(model);
    return [validator!, model2]
}

/**
 * Crea un nuevo validador y lo adjunta a un validador padre. Recmendado para hacer validaciones anidadas.
 * Si `key` o `validator` son `undefined` o `null` no se crea el `join`
 * @param key 
 * @param validator 
 * @returns 
 */
export function useValidatorJoin<T extends object>(key?: string|null, validator?: ValidatorController<any>|null): [ValidatorController<T> | undefined] {
    const [newValidator] = useValidator<T>(undefined, !!key && !!validator);
    useEffect(() => { key && newValidator && validator?.join(key, newValidator) }, []);
    useEffect(() => {
        return () => {
            key && validator?.join(key, null);
        }
    }, []);
    return [newValidator];
}


/**
 * Controlar lista desde react
 * @param data lista del modelo
 * @param create funcion para deifnir el nuevo modelo a crear dentro de la lisa del modelo
 * @returns 
 */
export function useArray<T, P>(data: Array<T>, create: (parent?: P) => T) {
    const [array, setArray] = useState(data);


    return {
        /**Lista de elementos */
        array,
        /**
         * Crear modelo en la vista.
         * @param parent 
         * @returns 
         */
        create(parent?: P) {
            return () => {
                const item = create(parent);
                data.push(item);
                setArray(() => [...data]);
            }
        },
        /**
         * Insertar nuevo elemento en una posicion expecifica
         * @param index 
         * @param parent 
         * @returns 
         */
        createByIndex(index: number, parent?: P) {
            return () => {
                const item = create(parent);
                data.splice(index, 0, item);
                setArray(() => [...data]);
            }
        },
        /**
         * Eliminar modelo de la vista
         * @param item 
         * @returns 
         */
        remove(item: T) {
            return () => {
                const index = data.indexOf(item);
                if (index !== -1) {
                    data.splice(index, 1);
                    setArray(() => [...data]);
                }
            }
        },
        /**
         * Elimina  un modelo de la lsita en la vista por un índice
         * @param index 
         * @returns 
         */
        removeByIndex(index: number) {
            return () => {
                data.splice(index, 1);
                setArray(() => [...data]);
            }
        },
        /**
         * Actualiza un modelo de la lista en la vista
         * @param item 
         * @returns 
         */
        update(item: T) {
            return () => {
                const index = data.indexOf(item);
                if (index !== -1) {
                    data[index] = item;
                    setArray(() => [...data]);
                }
            }
        },
        /**
         * Actualiza un modelo de la lista en la vista por un índice
         * @param index 
         * @param item 
         * @returns 
         */
        updateByIndex(index: number, item: T) {
            return () => {
                data[index] = item;
                setArray(() => [...data]);
            }
        },
        /**
         * Actualiza todos los modelos de la lista
         * @param callback
         * @returns
         */
        updateAll(callback: (item: T) => T) {
            return () => {
                setArray(() => data.map(callback));
            }
        },
        /**
         * Mover un modelo de un indice a otro
         * @param from referecia incial
         * @param to destino
         * @returns 
         */
        move(from: number, to: number) {
            return () => {
                const item = data[from];
                data.splice(from, 1);
                data.splice(to, 0, item);
                setArray(() => [...data]);
            }
        },
        /**
         * Obtener la lista original
         * @returns 
         */
        getArray() {
            return data;
        }
    }
}