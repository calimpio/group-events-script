import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
 * Crea un susbcriptor para escuchar si el contenido de un observador al modifcarse sin re renderizar la vista
 * @param observable 
 * @param callback2 funcion adicional si se desea 
 * @returns 
 */
export function useSubscriber<T>(
    observable?: ObservableOrSubscriberFunctionInstancer<T>,
    callback2?: (v: T) => void
) {

    const subscriber = useMemo(() => {
        if (!observable) return undefined;
        return typeof observable === "function"
            ? observable()
            : (observable as EventObservableController<T>).createSubscriber();
    }, [observable]);

    useEffect(() => {
        if (!subscriber || !callback2) return;
        subscriber.subscribe(callback2);
        return () => {
            subscriber.unsubscribe();
        };
    }, [subscriber, callback2]);

    return [subscriber];
}

/**
 * Obtener el valor del observable renderizando la vista en cada cambio.
 * @param observable 
 * @returns 
 */
export function useSubscriberData<T>(observable?: ObservableOrSubscriberFunctionInstancer<T>):
    [T | undefined, SubscriberController<T, string> | undefined] {
    const [value, setValue] = useState<T | undefined>();
    const handleChange = useCallback((v: T) => {
        setValue(v);
    }, []);
    const [subscriber] = useSubscriber(observable, handleChange);
    return [value, subscriber];
}


/**
 * Escuchar Evento o Brocast de Evento o un escuchador
 * @param event 
 * @param callback 
 * @returns 
 */
export function useListener<Props extends any[], Returns>(
    event?: EventOrBroadcastOrListenerFunctionInstancer<Props, Returns>,
    callback?: (...props: Props) => EventOrBroadcastOrListenerFunctionInstancer<Props, Returns> extends EventBroadcastController<Props, Returns> ? Promise<Returns> :
        EventOrBroadcastOrListenerFunctionInstancer<Props, Returns> extends EventBroadcastController<Props, Returns>["createBroadcastListener"] ? Promise<Returns> : void) {
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    });

    const listener = useMemo(() => {
        if (!event) return undefined;
        return typeof event === "function"
            ? event()
            : (event as any).createListener();
    }, [event]);

    useEffect(() => {
        if (!listener || !callback) return;
        const internalCallback = (...args: Props) => {
            return callbackRef.current?.(...args);
        };
        listener.on(internalCallback as any);
        return () => {
            listener.remove();
        }
    }, [listener, callback])
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

    const [task] = useState(() => taskManager.createTaskInstance());

    useEffect(() => {
        task.setTask(callback);
        if (execute) {
            taskManager.execTasks();
        }
        return () => {
            task.remove();
        };
    }, [task, callback, execute]);

    return taskManager;
}

/**
 * Crear validador
 * @param model 
 * @param buildValidator si es `false` no se crea en validador por defecto está en `true`
 * @returns 
 */
export function useValidator<T extends object>(model?: T, buildValidator: boolean = true): [ValidatorController<T> | undefined, T | undefined] {
    const validator = useMemo(() => {
        if (!buildValidator) return undefined;
        return eventer().createValidator<T>("validator");
    }, [buildValidator]);
    useEffect(() => {
        if (!validator) return;
        model && validator.setModel(model);
    }, [validator, model])
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
 * Realiza un join entre un `source` y un `target` con una `key`
 * Se elimina el join cuando la vista se elemina
 * @param source
 * @param target
 * @param key
 * @returns 
 */
export function useValidatorJoinLeft<S, T>(
    source?: ValidatorController<S> | null,
    target?: ValidatorController<T> | null,
    key?: string | null
): [ValidatorController<T> | undefined | null, ValidatorController<S> | undefined | null] {
    useEffect(() => {
        const activeSource = source;
        const activeKey = key;
        if (activeSource && target && activeKey) {
            activeSource.join(activeKey, target);
            return () => {
                activeSource.join(activeKey, null);
            };
        }
    }, [source, target, key]);
    return [target, source];
}

/**
 * Crea un nuevo validador y lo adjunta a un validador padre. Recomendado para hacer validaciones anidadas.
 * Si `key` o `validator` son `undefined` o `null` no se crea el `join`
 * @param key 
 * @param validator 
 * @returns 
 */
export function useValidatorJoin<T extends object>(key?: string | null, validator?: ValidatorController<any> | null): [ValidatorController<T> | undefined] {
    const newValidator = useMemo(() => {
        if (!key || !validator) return undefined;
        return eventer().createValidator<T>("nested-validator");
    }, [!!key, !!validator]);
    useValidatorJoinLeft(validator, newValidator, key)
    useEffect(() => {
        //
        return () => {
            //
        };
    }, [newValidator]);
    return [newValidator];
}

interface InputProps<V> {
    value: V,
    disabled?: boolean,
    focused?: boolean,
    onChange: (event: any) => void
}

/**
 * Validar una propiedad del modelo con Validador y aplicarle unas validaciones
 * 
 * para ejecuta las validactones esa: `validator.doValidation();//boolean`
 * @param model 
 * @param modelKey 
 * @param defaultValue 
 * @param validator 
 * @param validations 
 * @returns 
 */
export function useValidatorInput<K extends PropertyKey, V>(modelKey: K, defaultValue?: V, validator?: ValidatorController<Record<K, V>>, validations?: (value: V) => boolean | Promise<boolean>):
    [InputProps<V>, ValidatorController<Record<K, V>> | undefined] {

    const model = (validator?.getModel() || {} as Record<K, V>);
    const [value, setValue] = useState<V>(defaultValue ?? (model[modelKey] as V) ?? ('' as V));
    useMemo(() => {
        if (defaultValue && !model[modelKey]) {
            model[modelKey] = defaultValue;
            validator?.setPartialModel(model);
            setValue(defaultValue);
        }
    }, [modelKey, defaultValue, validator, validations])

    useListener(validator?.listeners().createValidationBroadcastListener, async () => {
        if (validations) {
            return [modelKey, await validations(model[modelKey] as V)];
        }
        return [modelKey, true];
    });

    const [disabled] = useSubscriberData(validator?.getEvents().subscribers().createDisabledSubscriber);
    const [focused] = useSubscriberData(validator?.getEvents().subscribers().createFocusedSubscriber);

    return [
        {
            value,
            disabled,
            focused: focused || undefined,
            onChange: async (event: any) => {
                const value = event.target.value as V;
                setValue(value);
                model[modelKey] = value;
                validator?.getProps(modelKey).onChange(value);
                if (validations) {
                    await validations(value);
                }
            }
        },
        validator
    ]
}


/**
 * Escuchar los cambios del modelo
 * @param validator 
 * @param callback 
 */
export function useValidatorOnChanges<T>(validator?: ValidatorController<T>, callback?: (key: keyof T, value: unknown) => void) {
    const createOnChangeListener = useMemo(() => {
        return validator?.getEvents().listeners().createOnChangeListener;
    }, [validator]);

    useListener(createOnChangeListener, (key, value) => {
        callback?.(key, value);
    });
}

/**
 * Escuchar los cambios de los validadores anidados por join
 * @param validator 
 * @param callback 
 */
export function useValidatorJoinOnChange(validator?: ValidatorController<any>, callback?: (joinKey: string, key: PropertyKey, child: ValidatorController<any>, model: any) => void) {
    const createJoinOnChangeListener = useMemo(() => {
        return validator?.listeners().createJoinOnChangeListener;
    }, [validator]);

    useListener(createJoinOnChangeListener, (joinKey, key, child, model) => {
        callback?.(joinKey, key, child, model);
    });
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

