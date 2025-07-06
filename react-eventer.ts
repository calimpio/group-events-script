import { useEffect, useState } from "react";
import { EventBrocastController, EventController, eventer, EventObservableController, SubscriberController } from ".";


type ObservableOrSubscriberFunctionInstancer<T> = EventObservableController<T> |
    EventObservableController<T>["createSubscriber"] |
    undefined;

type EventOrBrocastOrListenerFunctionInstancer<Props extends any[], Returns> =
    EventController<Props> | EventController<Props>["createListener"] |
    EventBrocastController<Props, Returns> |
    EventBrocastController<Props, Returns>["createBroadcastListener"] |
    undefined;

/**
 * Observar el conetenido de un EventObservableController o Subscriber
 * @param observable 
 * @param callback2 funcion adicional si se desea 
 * @returns 
 */
export function useObservable<T>(observable?: ObservableOrSubscriberFunctionInstancer<T>, callback2?: (v: T) => void):
    [ObservableOrSubscriberFunctionInstancer<T> extends undefined ? unknown : T, ObservableOrSubscriberFunctionInstancer<T> extends undefined ? undefined : SubscriberController<T, string>, boolean] {
    const [subscriber] = useState(typeof observable == "function" && observable() || (observable as EventObservableController<T> | undefined)?.createSubscriber());
    const [subscriber2] = useState(callback2 ? (typeof observable == "function" && observable() || (observable as EventObservableController<T> | undefined)?.createSubscriber()) : undefined);
    const state = useState(false);
    const react = subscriber?.react();
    useEffect(() => react?.updateEffect(state)(), [state[0]]);
    useEffect(() => { callback2 && subscriber2?.subscribe(callback2); return () => callback2 && subscriber2?.unsubscribe() });
    const value = subscriber?.get() as ObservableOrSubscriberFunctionInstancer<T> extends undefined ? unknown : T;
    const subs = subscriber as ObservableOrSubscriberFunctionInstancer<T> extends undefined ? undefined : SubscriberController<T, string>
    return [value, subs, state[0]]
}


/**
 * Escuchar Evento o Brocast de Evento o un escuchador
 * @param event 
 * @param callback 
 * @returns 
 */
export function useListener<Props extends any[], Returns>(
    event: EventOrBrocastOrListenerFunctionInstancer<Props, Returns>,
    callback?: (...props: Props) => EventOrBrocastOrListenerFunctionInstancer<Props, Returns> extends EventBrocastController<Props, Returns> ? Promise<Returns> :
        EventOrBrocastOrListenerFunctionInstancer<Props, Returns> extends EventBrocastController<Props, Returns>["createBroadcastListener"] ? Promise<Returns> : void) {
    const [listener] = useState(typeof event == "function" && event() || (event as EventController<Props>)?.createListener());
    useEffect(() => { (listener as any)?.on(callback); return () => listener?.remove(); })
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
    })
    return taskManager;
}