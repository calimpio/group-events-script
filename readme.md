
**Versión: 3.2.9**

-----

<img src="./eventer_logo.svg" width="60%" style="display: flex; aling-items: center; justify-content: center; margin: auto; border-radius: 5%">

# Documentación de la Librería Eventer

Eventer es una librería de gestión de eventos robusta y versátil para TypeScript, diseñada para actuar como un **orquestador de lógica de aplicación**. Facilita la comunicación entre componentes, la gestión de estados reactivos y la orquestación de tareas asíncronas en aplicaciones JavaScript. Proporciona una API rica y tipada que abarca desde eventos simples hasta patrones más complejos como observables, loaders, managers de tareas y validadores de formularios, e incluye hooks de React para una integración fluida.

## Contenido

1. [Lo Nuevo en la Versión 3.2.x](#lo-nuevo-en-la-versi%C3%B3n-32x)
2. [¿Por qué usar Eventer?](#por-qué-usar-eventer)
3. [Ejemplo práctico](#ejemplo-práctico)
4. [Instalación](#instalaci%C3%B3n)
5. [Uso Básico](#uso-b%C3%A1sico)
6. [Tipos de Controladores y Funcionalidades](#tipos-de-controladores-y-funcionalidades)
   - [ListenerController](#listenercontroller)
   - [EventController](#eventcontroller)
   - [EventBroadcastController](#eventbroadcastcontroller)
   - [EventObservableController](#eventobservablecontroller)
   - [LoaderController](#loadercontroller)
   - [TaskManager](#taskmanager)
   - [ValidatorController](#validatorcontroller)
   - [TimerController](#timercontroller)
7. [Ejemplos Avanzados](#ejemplos-avanzados)
   - [Eventos simples (`EventController`)](#eventos-simples-con-eventcontroller)
   - [Eventos broadcast para consultas distribuidas](#eventos-broadcast-para-consultas-distribuidas)
   - [Observables y suscriptores](#observables-y-suscriptores)
   - [LoaderController para tareas asíncronas](#loadercontroller-para-tareas-asíncronas)
   - [Orquestación con TaskManager](#orquestacion-con-taskmanager)
   - [Validadores y formularios](#validadores-y-formularios)
8. [Hooks de React para Eventer](#hooks-de-react-para-eventer)
   - [useListener](#uselistener)
   - [useObservable (obsoleto)](#useobservable-obsoleto)
   - [useSubscriber](#usesubscriber)
   - [useSubscriberData (recomendado)](#usesubscriberdata-recomendado)
   - [useObservableData (obsoleto)](#useobservabledata-obsoleto)
   - [useGlobalTaskManager](#useglobaltaskmanager)
   - [useTask](#usetask)
   - [useValidator](#usevalidator)
   - [useValidatorModel](#usevalidatormodel)
   - [useValidatorJoin](#usevalidatorjoin)
   - [useArray](#usearray)
9. [Consideraciones de Desarrollo](#consideraciones-de-desarrollo)

## Lo Nuevo en la Versión 3.2.x

Esta versión introduce mejoras significativas en la gestión de eventos, el estado reactivo y la integración con React, haciendo la librería más potente y fácil de usar.

*   **Ejecución Paralela y Segura de Eventos**: Se han añadido los métodos `emitParallel`, `emitSettled`, `broadcastEmitParallel` y `broadcastEmitSettled` para un control más granular sobre cómo se ejecutan los escuchadores de eventos y cómo se manejan los errores.
*   **Nuevos Métodos para Observables**: Los `EventObservableController` ahora incluyen métodos de utilidad como `switch()` para booleanos, y `increment()`/`decrement()` para números, simplificando las operaciones comunes.
*   **Mejoras en `ValidatorController`**:
    *   El método `join` ahora permite anidar validadores para construir formularios complejos y modulares.
    *   `getEvents` proporciona acceso a estados de `disabled` y `focused` para todo el formulario, incluyendo validadores anidados.
*   **Hooks de React Mejorados**:
    *   Se introducen `useSubscriberData` y `useSubscriber` como los hooks recomendados para consumir datos de observables, reemplazando a los ahora obsoletos `useObservable` y `useObservableData`.
    *   Nuevo hook `useValidatorModel` para una inicialización más limpia de validadores con su modelo.
*   **Gestión de Arrays en React**: El nuevo hook `useArray` simplifica drásticamente la manipulación de listas en el estado de los componentes.
*   **Instancias de Tareas Flexibles**: `TaskManager` ahora cuenta con `createTaskInstance`, que permite crear tareas cuya clave se asigna dinámicamente, facilitando su uso en contextos donde la clave no se conoce de antemano.

## ¿Por qué usar Eventer?

Eventer es ideal para desacoplar la lógica de negocio de la interfaz de usuario o de la infraestructura específica. Su diseño agnóstico y basado en eventos lo hace perfecto para:

*   **Crear SDKs**: Encapsula la lógica compleja y expón una API limpia basada en eventos para que los consumidores se suscriban a cambios o resultados sin conocer los detalles internos.
*   **Desarrollo de CLIs**: Gestiona flujos de trabajo asíncronos, barras de progreso y tareas secuenciales en herramientas de línea de comandos de forma ordenada.
*   **Componentes de React**: Construye componentes que reaccionan a cambios de estado complejos o eventos globales sin prop drilling excesivo o contextos pesados.
*   **Micro-frontends**: Facilita la comunicación entre diferentes partes de una aplicación distribuida sin acoplamiento directo.
*   **Gestión de Formularios Complejos**: Orquesta validaciones asíncronas, dependencias entre campos y estados de UI (loading, disabled) de manera centralizada.

-----

## Instalación

```bash
npm i orquest-eventer@3.2.9
```

-----

## Uso Básico

Para comenzar, importa la función `eventer` y crea una instancia de `GroupEvent`:

```typescript
import { eventer } from "orquest-eventer";

const appEvents = eventer("myApp"); // "myApp" es un prefijo opcional para los nombres de eventos, útil para depuración.
```

### Ejemplo práctico
```typescript
import { eventer } from "orquest-eventer";
import { useListener } from "orquest-eventer/react-eventer";
import { useState } from "react";
import Notification, { NotificationProps } from "./Notification";

//1. creas la instancia de eventer
const events = eventer();

//2. defines tus eventos
const pushNotification = events.createEvent("pushNotification")<[children: React.ReactNode, duration: number, position?: NotificationProps["position"]]>()

interface NotificationsViewProps {}

const Notifications = function ({ }: NotificationsViewProps){
    const [notifications, setNotifications ] = useState<{children: React.ReactNode, duration: number, position?: NotificationProps["position"]}[]>([])

    //3. escuchas el evento desde react
    useListener(pushNotification.createListener, (children, duration, position) => {
        setNotifications(prev => [...prev, {children, duration, position}])
    });

    const onNotificationClose = (index: number) => () => {
        setNotifications(prev => prev.filter((_, i) => i != index))
    }

    return (<>
        {notifications.map((notification, index) => {
            return <Notification key={index} duration={notification.duration} position={notification.position} onClose={onNotificationClose(index)}>
                {notification.children}
            </Notification>
        })}
    </>);
}

export default Notifications;

//4. Distribuir los eventos
Notifications.pushNotification = pushNotification.emit;
```

-----

## Tipos de Controladores y Funcionalidades

Eventer ofrece varios tipos de controladores, cada uno diseñado para un caso de uso específico:

### ListenerController

El **`ListenerController`** es la interfaz fundamental para gestionar un único escuchador de eventos.

  * **`on(callback: (...props: Props) => Returns, doOneTime?: boolean): void`**: Modifica o asigna el callback que se ejecutará cuando se emita el evento.
      * `callback`: La función a ejecutar.
      * `doOneTime`: Si es `true`, el escuchador se eliminará automáticamente después de su primera ejecución.
  * **`remove(): void`**: Elimina el escuchador del evento.
  * **`state: Readonly<"idle" | "removed" | "running" | "willRemove" | "detached" | "willAttach">`**: El estado actual del escuchador.
  * **`onRemoveEvent(callback: () => void): void`**: Registra un callback que se ejecutará cuando el escuchador sea eliminado.

-----

### EventController

Permite crear y gestionar **eventos unidireccionales**. Son útiles para notificar a los suscriptores que algo ha ocurrido.

  * **`createEvent<Name extends PropertyKey>(name: Name)`**: Crea una factoría para un evento específico.

    ```typescript
    const userLoggedIn = appEvents.createEvent("userLoggedIn")<[userId: string, userName: string]>();
    ```

    También puedes configurar opciones de manejo de errores:
    ```typescript
    const safeEvent = appEvents.createEvent("safeEvent", { onError: 'continue' })<[]>();
    ```

  * **`createListener(): ListenerController<Props, Promise<void> | void, Name>`**: Crea un escuchador único para este evento.

    ```typescript
    userLoggedIn.createListener().on((userId, userName) => {
        console.log(`Usuario ${userName} (${userId}) ha iniciado sesión.`);
    });
    ```

  * **`emit(...params: Props): Promise<void>`**: Emite el evento, ejecutando todos sus escuchadores de forma secuencial.

    ```typescript
    await userLoggedIn.emit("123", "Alice");
    ```

  * **`emitParallel(...params: Props): Promise<void>`**: Emite el evento, ejecutando todos sus escuchadores en paralelo.

    ```typescript
    await userLoggedIn.emitParallel("123", "Alice");
    ```

  * **`emitSettled(...params: Props): Promise<EmitResult<void>>`**: Emite el evento de forma segura, capturando errores sin detener la ejecución (dependiendo de la configuración) y devolviendo un reporte.

    ```typescript
    const result = await userLoggedIn.emitSettled("123", "Alice");
    if (!result.success) {
        console.error("Errores ocurridos:", result.errors);
    }
    ```

  * **`removeEvent(): void`**: Elimina **todos** los escuchadores asociados a este evento.

-----

### EventBroadcastController

Similar a `EventController`, pero permite que los escuchadores **devuelvan un valor**, y `broadcastEmit` recopila todas estas respuestas. Ideal para validaciones o consultas distribuidas.

  * **`createBroadcast<Name extends string>(name: Name)`**: Crea una factoría para un evento broadcast.

    ```typescript
    const validateForm = appEvents.createBroadcast("validateForm")<[data: any], boolean>();
    ```

  * **`createBroadcastListener(): ListenerController<Props, Promise<Returns> | Returns, Name>`**: Crea un escuchador que puede devolver un valor.

    ```typescript
    validateForm.createBroadcastListener().on((data) => {
        console.log("Validando datos:", data);
        return data.name !== ""; // Devuelve true si el nombre no está vacío
    });
    ```

  * **`broadcastEmit(...params: Props): Promise<Returns[] | undefined>`**: Emite el evento y devuelve un array con los resultados de cada escuchador.

    ```typescript
    const results = await validateForm.broadcastEmit({ name: "Juan", age: 30 });
    console.log("Resultados de validación:", results); // [true]
    ```

  * **`broadcastEmitParallel(...params: Props): Promise<Returns[] | undefined>`**: Emite el evento en paralelo y devuelve un array con los resultados de cada escuchador.

    ```typescript
    const results = await validateForm.broadcastEmitParallel({ name: "Juan", age: 30 });
    ```

  * **`broadcastEmitSettled(...params: Props): Promise<EmitResult<Returns>>`**: Emite el evento y devuelve un objeto con los resultados y los errores capturados, útil para cuando algunos escuchadores pueden fallar pero se necesitan los resultados de los que tuvieron éxito.

    ```typescript
    const { results, errors } = await validateForm.broadcastEmitSettled({ ... });
    ```

-----

### EventObservableController

Implementa un patrón **observable**, permitiendo que un valor sea observado y notifique a los suscriptores cuando cambie. Es similar a un `Subject` de RxJS.

  * **`createObservable<Name extends string>(name: Name)`**: Crea una factoría para un observable.

    ```typescript
    const currentTheme = appEvents.createObservable("theme")("light"); // Valor inicial "light"
    ```

  * **`next(value: T, force?: boolean): Promise<T>`**: Modifica el valor del observable y emite un evento si el nuevo valor es diferente al anterior (o si `force` es `true`).

  * **`createSubscriber(key?: string, callback?: (value: T) => Promise<void> | void, noFirstCall?: boolean, doOneTime?: boolean): SubscriberController<T, Name>`**: Crea un suscriptor para el observable.

      * `key`: Opcional, un identificador para el suscriptor.
      * `callback`: Opcional, una función que se ejecuta con el valor actual y cada vez que cambia.
      * `noFirstCall`: Si es `true`, el `callback` no se ejecuta inmediatamente con el valor inicial.
      * `doOneTime`: Si es `true`, la suscripción se deshará después de la primera ejecución del callback.

  * **`get(): T`**: Obtiene el valor actual del observable.

  * **`has(fun: (value: NonNullable<T>) => void): void`**: Ejecuta la función `fun` solo si el valor no es `null` o `undefined`.

  * **`unsubscribes(): void`**: Elimina todas las suscripciones a este observable.

  * **`readOnly(): EventObservableReaderController<T, Name>`**: Devuelve una versión de solo lectura del observable, sin el método `next`.

  * **`switch(): Promise<boolean>`**: Alterna el valor de un observable booleano.

  * **`increment(value?: number): Promise<number>`**: Incrementa el valor del observable numérico.

  * **`decrement(value?: number): Promise<number>`**: Decrementa el valor del observable numérico.

#### `SubscriberController<T, Name>`

Controla una suscripción individual a un observable.

  * **`subscribe(callback: (value: T) => Promise<void> | void, noFirstCall?: boolean, doOneTime?: boolean): ListenerController<[value: T], Promise<void> | void, Name>`**: Suscribe un callback al observable.

  * **`next(value: T, force?: boolean): Promise<T>`**: (Solo si no es de solo lectura) Modifica el valor del observable desde el suscriptor.

  * **`unsubscribe(): void`**: Elimina esta suscripción específica.

  * **`get(): T`**: Obtiene el valor actual del observable.

  * **`react(): SubscriberControllerReact<T, Name>`**: Utilidad para integración con React.

      * **`updateEffect(state: State<boolean>): () => () => void`**: Retorna una función para usar con `useEffect` de React para forzar actualizaciones de componentes cuando el observable cambia.

    <!-- end list -->

    ```typescript
    // En un componente React
    import { useState, useEffect } from 'react';
    import { currentTheme } from './your-events-file'; // Importa tu observable

    function ThemeDisplay() {
        const [_, update] = useState(false);
        useEffect(currentTheme.createSubscriber().react().updateEffect([_, update]), []);

        return <div>Tema actual: {currentTheme.get()}</div>;
    }
    ```

-----

### LoaderController

Gestiona el ciclo de vida de una **tarea asíncrona**, proporcionando estados de carga y eventos para éxito o error.

  * **`createLoader<Props extends any[], T, Name extends string>(name: Name, task: (...props: Props) => Promise<T>)`**: Crea un controlador de loader.

      * `name`: Nombre del loader.
      * `task`: La función asíncrona a ejecutar.

    <!-- end list -->

    ```typescript
    const fetchUserData = appEvents.createLoader("fetchUser", async (userId: string) => {
        // Simula una API call
        return new Promise<{ name: string }>(resolve => setTimeout(() => resolve({ name: "Juan" }), 1500));
    });
    ```

  * **`exec(...props: Props): Promise<T | void>`**: Ejecuta la tarea si no está cargando actualmente. Devuelve el resultado de la tarea.

  * **`isLoading(): boolean`**: Indica si la tarea está en progreso.

  * **`setTask(callback: (...props: Props) => Promise<T>): LoaderController<Props, T>`**: Modifica la función de la tarea sin ejecutarla.

  * **`listeners()`**: Proporciona escuchadores para eventos del loader.

      * **`createOnDoneListener(): ListenerController<[data: T]>`**: Se ejecuta cuando la tarea finaliza exitosamente.
      * **`createOnErrorListener(): ListenerController<[error: any]>`**: Se ejecuta si la tarea falla.

  * **`readOnly()`**: Devuelve una versión de solo lectura del loader.

-----

-----

### TaskManager

Permite **gestionar y ejecutar múltiples tareas asíncronas** de forma secuencial. Ideal para flujos de trabajo con dependencias o validaciones en cascada.

  * **`createTasksManager<TKey extends string = string, Name extends string = string>(name: Name)`**: Crea un manager de tareas.

    ```typescript
    const formSaveTasks = appEvents.createTasksManager("saveForm");
    ```

  * **`addTask(key: TKey, fun: () => Promise<any>): TaskManager<TKey>`**: Añade una tarea al manager con una clave única.

  * **`removeTask(key: TKey): TaskManager<TKey>`**: Elimina una tarea por su clave.

  * **`createTaskInstance(): Task<TKey>`**: Crea una instancia de tarea sin clave predefinida. La clave se asignará automáticamente (UUID) al llamar a `setTask`.
      * La interfaz `Task` devuelta tiene los métodos `setTask(fun)` y `remove()`.

  * **`execTasks(): Promise<void>`**: Inicia la ejecución secuencial de todas las tareas añadidas.

  * **`resetTasks(): void`**: Reinicia el estado del manager y elimina todas las tareas.

  * **`isExecuting(): boolean`**: Indica si hay tareas en ejecución.

  * **`stop(): void`**: Detiene la ejecución actual de las tareas.

  * **`setTaskValidator(key: TKey, validator: ValidatorController<any> | null): void`**: Asocia un validador a una tarea específica (característica en desarrollo).

  * **`listeners()`**: Proporciona escuchadores para eventos del manager.

      * **`createStartExecutionListener()`**: Cuando comienza la ejecución de tareas.
      * **`createEndExecutionListener()`**: Cuando todas las tareas han finalizado.
      * **`createForEachAllTaskErrorListener()`**: Cuando una tarea individual falla.
      * **`createOnTaskDoneListener(key: TKey)`**: Cuando una tarea específica finaliza exitosamente.

-----

### ValidatorController

Proporciona una estructura para la **validación de modelos de formularios**, integrando la reactividad y la gestión de eventos.

  * **`createValidator<Model extends object, Name extends string>(name: Name)`**: Crea un controlador de validador.

    ```typescript
    interface UserForm { name: string; email: string; }
    const userValidator = appEvents.createValidator<UserForm>("userForm");
    ```

  * **`setModel(model: Model): void`**: Establece el modelo completo a validar.

  * **`setPartialModel(model: Model): void`**: Actualiza el modelo parcialmente.

  * **`getProps(key: keyof Model, onChange?: (value: any) => void): FormProps`**: Obtiene las propiedades necesarias para vincular un campo del formulario (ej. `onChange`). El `onChange` interno notifica al validador sobre el cambio de valor e incluye un *debounce* de 100ms.

  * **`getEvents(): FormEventsController<Model, ...>`**: Obtiene un controlador para eventos y estados a nivel de formulario.

      * **`FormEventsController`**:
          * **`listeners()`**: Contiene `createOnChangeListener()` para cuando una propiedad del modelo cambia.
          * **`getDisabled(): boolean` / `setDisabled(value: boolean): void`**: Para gestionar el estado `disabled` del formulario y todos sus validadores anidados.
          * **`getFocused(): boolean` / `setFocused(value: boolean): void`**: Para gestionar el estado `focused` del formulario y sus validadores anidados.
          * **`subscribers()`**: Contiene `createDisabledSubscriber()` y `createFocusedSubscriber()` para observar estos estados.

  * **`getModel(): Model | undefined`**: Obtiene el modelo actual.

  * **`doValidation(): Promise<boolean>`**: Ejecuta las validaciones. Envía un evento broadcast y recopila los resultados.

  * **`join(key: string, validator: ValidatorController<any> | null): void`**: Une un validador hijo a una clave específica del modelo actual. Permite validaciones anidadas donde el resultado del padre depende de los hijos.

  * **`setDebug(value: boolean): void`**: Activa/desactiva el modo de depuración.

  * **`setTaskManager(v: TaskManager | null): void` / `getTaskManager(): TaskManager | null`**: Para asociar un `TaskManager` al validador.

  * **`listeners()`**: Proporciona escuchadores para eventos del validador.

      * **`createSetTaskManagerListener()`**: Cuando se establece el `TaskManager`.
      * **`createValidationBroadcastListener()`**: Crea un escuchador que participa en el proceso de validación. Aquí es donde se debe implementar la lógica de validación para un campo específico.
#### Ejemplo de uso:

```typescript
import React, { useState, useEffect } from 'react';
import { ValidatorController } from 'orquest-eventer';
import { useListener, useObservable } from 'orquest-eventer/react-eventer';

interface InputProps<T extends object> {
    /**
     * El modelo de datos (opcional si el validador ya lo tiene, 
     * pero útil para inicializar el estado local)
     */
    model: T;
    /**
     * La clave de la propiedad en el modelo que este input controla
     */
    modelKey: keyof T;
    /**
     * La instancia del controlador de validación
     */
    validator: ValidatorController<T>;
    label: string;
    type?: string;
    placeholder?: string;
}

export const Input = <T extends object>({ 
    model, 
    modelKey, 
    validator, 
    label, 
    type = "text",
    placeholder 
}: InputProps<T>) => {
    // Estado local para el valor y el error
    const [value, setValue] = useState<any>(model[modelKey] || "");
    const [error, setError] = useState<string | null>(null);

    // 1. Implementación de useListener para validaciones
    // Escuchamos el evento broadcast de validación. Cuando validator.doValidation() se ejecute,
    // este callback será invocado.
    useListener(
        validator.listeners().createValidationBroadcastListener, 
        async () => {
            let isValid = true;
            let errorMessage = null;

            // Lógica de validación personalizada para este input
            // Ejemplo: Validar que no esté vacío
            if (!value || (typeof value === 'string' && value.trim() === "")) {
                isValid = false;
                errorMessage = `${label} es requerido`;
            }

            // Actualizamos el estado visual del error
            setError(errorMessage);

            // Retornamos la tupla [clave, esValido] como espera el ValidatorController
            // Esto permite al validador saber qué campo es y si pasó la prueba
            return [modelKey, isValid];
        }
    );

    // 2. Implementación de suscriptores de estado del formulario
    // Usamos useObservable para suscribirnos al estado 'disabled' del formulario.
    // Si validator.getEvents().setDisabled(true) es llamado, este componente se actualizará.
    const [isDisabled] = useObservable(
        validator.getEvents().subscribers().createDisabledSubscriber
    );

    // 3. Vinculación con el validador para notificar cambios
    // Obtenemos la función onChange del validador para mantener el modelo sincronizado
    const { onChange: notifyValidator } = validator.getProps(modelKey);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        
        // Actualizamos estado local
        setValue(newValue);
        
        // Notificamos al validador (esto actualiza el modelo interno del validador y emite eventos onChange)
        notifyValidator(newValue);
        
        // Limpiamos el error mientras el usuario escribe
        if (error) setError(null);
    };

    return (
        <div className="input-container" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={handleChange}
                disabled={isDisabled}
                placeholder={placeholder}
                style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: `1px solid ${error ? 'red' : '#ccc'}`,
                    backgroundColor: isDisabled ? '#f5f5f5' : 'white',
                    cursor: isDisabled ? 'not-allowed' : 'text'
                }}
            />
            {error && (
                <span style={{ color: 'red', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                    {error}
                </span>
            )}
        </div>
    );
};
```
-----

### TimerController

Permite crear y controlar un **temporizador** con eventos para cada etapa de su ciclo de vida.

  * **`createTimer<Name extends string>(name: Name): <T extends any[] = any[]>() => TimerController<T, Name>`**: Crea una factoría para un temporizador.

    ```typescript
    const downloadTimer = appEvents.createTimer("download");
    const myDownloadTimer = downloadTimer<[status: string]>();
    ```

  * **`start(time: number, per: number, resolve: () => CompleteParams): void`**: Inicia o reanuda el temporizador.

      * `time`: Duración total en unidades (ej. milisegundos).
      * `per`: Intervalo de actualización en unidades (ej. milisegundos).
      * `resolve`: Una función que devuelve los parámetros para el evento `onCompleted`.

  * **`stop(): void`**: Detiene el temporizador y lo resetea.

  * **`pause(): void`**: Pausa el temporizador.

  * **`listeners()`**: Proporciona escuchadores para eventos del temporizador.

      * **`createOnStartedListener()`**: Cuando el temporizador inicia.
      * **`createOnPausedListener()`**: Cuando el temporizador se pausa.
      * **`createOnRunningListener()`**: Durante la ejecución (actualmente no implementado para emitir).
      * **`createOnStoppedListener()`**: Cuando el temporizador se detiene.
      * **`createOnCompletedListener()`**: Cuando el temporizador llega a su fin.

-----

## Ejemplos Avanzados

A continuación encontrarás ejemplos prácticos que muestran cómo utilizar diferentes partes de Eventer en escenarios reales.

### Eventos simples con `EventController`
```typescript
import { eventer } from "orquest-eventer";

const app = eventer();
const loginEvent = app.createEvent("login")<[userId: string]>();

// registrar un escuchador
loginEvent.createListener().on(userId => {
    console.log("usuario ingresado", userId);
});

// emitir el evento
await loginEvent.emit("abc123");

// manejar errores con emitSettled
const failingEvent = app.createEvent("failing")<[]>();
failingEvent.createListener().on(() => { throw new Error("boom"); });
const result = await failingEvent.emitSettled();
if (!result.success) {
    console.error("Errores capturados:", result.errors);
}
```

### Eventos broadcast para consultas distribuidas
```typescript
const validator = app.createBroadcast("check")<[value: number], boolean>();
validator.createBroadcastListener().on(v => v > 0);
validator.createBroadcastListener().on(v => v % 2 === 0);

const answers = await validator.broadcastEmit(4); // [true, true]
```

### Observables y suscriptores
```typescript
const state = app.createObservable("counter")<number>(0);
const sub = state.createSubscriber("ui", val => console.log("cont", val));

await state.next(1);      // imprime 'cont 1'
await sub.next(5);        // el suscriptor también puede cambiar el valor
```

### LoaderController para tareas asíncronas
```typescript
const loader = app.createLoader("fetch", (url: string) => fetch(url).then(r => r.json()));
loader.listeners().createOnErrorListener().on(err => console.error("failed", err));

await loader.exec("https://jsonplaceholder.typicode.com/todos/1");
```

### Orquestación con TaskManager
```typescript
const mgr = app.createTasksManager("flow");
mgr.addTask("step1", async () => console.log("primer paso"));
mgr.addTask("step2", async () => console.log("segundo paso"));

await mgr.execTasks();
```

### Validadores y formularios
```typescript
interface Form { name: string; age: number; }
const valid = app.createValidator<Form>("form");
valid.setModel({ name: "", age: 0 });
valid.listeners().createValidationBroadcastListener().on(async () => {
  const model = valid.getModel();
  return !!model?.name && model.age > 0;
});

const ok = await valid.doValidation(); // boolean
```

## Hooks de React para Eventer

Eventer proporciona un conjunto de hooks de React para integrar fácilmente sus controladores de eventos y observables con el ciclo de vida de los componentes funcionales, permitiendo una gestión de estado y una comunicación entre componentes más **reactiva** y **declarativa**.

-----

### useListener

Este hook permite a un componente de React **escuchar eventos** creados con `EventController` o `EventBroadcastController`, o directamente a un "listener instancer" (una función que crea un escuchador). El escuchador se registrará cuando el componente se monte y se limpiará automáticamente cuando el componente se desmonte.

### Parámetros

  * **`event`**: Una instancia de `EventController<Props>`, `EventBroadcastController<Props, Returns>`, o una función que, al ser llamada (`event()`), retorna una instancia de `ListenerController`.
  * **`callback`** (opcional): La función que se ejecutará cuando el evento sea emitido. El tipo de retorno de este callback es inferido, permitiendo devolver `Promise<Returns>` para eventos broadcast y `void` para eventos normales.

### Valores de Retorno

  * Retorna `null`. Este hook está diseñado para efectos secundarios.

### Ejemplo de Uso

```typescript
import { eventer } from "orquest-eventer";
import { useListener } from "orquest-eventer/react-eventer";

const appEvents = eventer();
const userSavedEvent = appEvents.createEvent("userSaved")<[userId: string]>();

function UserStatusMessage() {
    useListener(userSavedEvent.createListener, (userId) => {
        console.log(`Usuario con ID ${userId} ha sido guardado exitosamente.`);
        alert(`¡Usuario ${userId} guardado!`);
    });

    const handleSaveUser = async () => {
        await userSavedEvent.emit("456");
    };

    return (
        <div>
            <p>Monitoreando eventos de usuario...</p>
            <button onClick={handleSaveUser}>Simular Guardar Usuario</button>
        </div>
    );
}
```

-----

### useObservable (obsoleto)

> **Obsoleto**: Se recomienda usar `useSubscriberData` para obtener el valor reactivo y `useSubscriber` para efectos secundarios.

Este hook permite a un componente de React **suscribirse a un `EventObservableController` o a una función que cree un `SubscriberController`**, y obtener el valor actual del observable. El componente se **re-renderizará automáticamente** cada vez que el valor del observable cambie.

### Parámetros

  * **`observable`**: Una instancia de `EventObservableController<T>` o una función que, al ser llamada (`observable()`), retorna una instancia de `SubscriberController<T, string>`. Este es el observable al que el componente se suscribirá.
  * **`callback2`** (opcional): Una función adicional que se ejecutará cada vez que el valor del observable cambie.

### Valores de Retorno

Retorna una tupla con tres elementos:

1.  **`value`**: El valor actual del observable. Su tipo es inferido a partir del tipo `T` del observable.
2.  **`subscriber`**: La instancia de `SubscriberController<T, string>` creada o utilizada por el hook.
3.  **`state[0]`**: Un valor booleano interno del hook, que se actualiza para forzar la re-renderización del componente.

### Ejemplo de Uso

```typescript
import { useEffect, useState } from "react";
import { eventer } from "orquest-eventer";
import { useObservable } from "orquest-eventer/react-eventer";

const appEvents = eventer();
const userNameObservable = appEvents.createObservable("userName")("Invitado");

function UserNameDisplay() {
    const [name, subscriber] = useObservable(userNameObservable);

    const handleChangeName = () => {
        subscriber?.next("Alice");
    };

    return (
        <div>
            <h2>Nombre de Usuario: {name}</h2>
            <button onClick={handleChangeName}>Cambiar Nombre a Alice</button>
        </div>
    );
}
```

-----

### useSubscriber

Crea un suscriptor para un observable pero **no** re-renderiza el componente. Es útil para ejecutar efectos secundarios en respuesta a cambios en el observable sin afectar la UI.

### Parámetros

  * **`observable`**: El `EventObservableController` a observar.
  * **`callback2`** (opcional): Una función que se ejecutará cada vez que el valor cambie.

### Valores de Retorno

Retorna una tupla con el `SubscriberController`: `[subscriber]`.

-----

### useSubscriberData (recomendado)

Este hook se suscribe a un observable y devuelve su valor actual, re-renderizando el componente en cada cambio. Es la forma recomendada de consumir datos de un observable en la UI.

### Parámetros

  * **`observable`**: La instancia de `EventObservableController` o una función que cree un `SubscriberController`.

### Valores de Retorno

Retorna una tupla `[value, subscriber]`:

1.  **`value: T | undefined`**: El valor actual del observable.
2.  **`subscriber: SubscriberController<T, string>`**: La instancia del suscriptor, que contiene métodos como `next`.

### Ejemplo de Uso

```typescript
import { useSubscriberData } from "orquest-eventer/react-eventer";
import { userNameObservable } from "./your-events-file";

function UserProfileEditor() {
    const [name, subscriber] = useSubscriberData(userNameObservable);

    return (
        <div>
            <h3>Editar Perfil</h3>
            <label>Nombre de usuario:</label>
            <input 
                type="text" 
                value={name || ''} 
                onChange={(e) => subscriber?.next(e.target.value)} 
            />
        </div>
    );
}
```

-----

### useObservableData (obsoleto)

> **Obsoleto**: Se recomienda usar `useSubscriberData`.

Este hook se suscribe a un observable y devuelve su valor actual, re-renderizando el componente en cada cambio. También devuelve el método `next` del suscriptor para poder modificar el valor.

### Parámetros

*   **`observable`**: La instancia de `EventObservableController` o una función que cree un `SubscriberController`.

### Valores de Retorno

Retorna una tupla `[value, next]`:

1.  **`value: T | undefined`**: El valor actual del observable.
2.  **`next: ((value: T, force?: boolean) => void) | undefined`**: Una función para actualizar el valor del observable.

-----

### useGlobalTaskManager

Este hook proporciona acceso a una instancia global de **`TaskManager`**, preconfigurada para tu aplicación. Permite gestionar y orquestar secuencias de tareas asíncronas desde cualquier componente de forma centralizada.

### Valores de Retorno

  * Retorna la instancia global de `TaskManager`.

### Ejemplo de Uso

```typescript
import { useGlobalTaskManager } from "orquest-eventer/react-eventer";

function TaskProgressMonitor() {
    const globalTaskManager = useGlobalTaskManager();

    const handleStartAllTasks = () => {
        if (!globalTaskManager.isExecuting()) {
            globalTaskManager.execTasks();
        }
    };

    return (
        <div>
            <h3>Gestor de Tareas Global</h3>
            <p>¿Tareas en ejecución?: {globalTaskManager.isExecuting() ? "Sí" : "No"}</p>
            <button onClick={handleStartAllTasks}>Iniciar Todas las Tareas</button>
        </div>
    );
}
```

-----

### useTask

Este hook permite **crear una tarea asíncrona** y añadirla a la instancia global de `TaskManager`. Es útil para encapsular operaciones asíncronas dentro de un componente que deben ser gestionadas por un orquestador de tareas.

### Parámetros

  * **`callback`**: Una función asíncrona (`() => Promise<void>`) que representa la tarea a ejecutar.
  * **`execute`** (opcional): Si es `true`, el `taskManager` global intentará ejecutar todas las tareas pendientes inmediatamente después de que esta tarea sea añadida.

### Valores de Retorno

  * Retorna la instancia global de `TaskManager`.

### Ejemplo de Uso

```typescript
import { useTask, useGlobalTaskManager } from "orquest-eventer/react-eventer";

function DataSyncComponent() {
    const globalTaskManager = useGlobalTaskManager();

    useTask(async () => {
        console.log("Iniciando sincronización de datos...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log("Sincronización de datos completada.");
    }, false);

    const handleManualSync = () => {
        globalTaskManager.execTasks();
    };

    return (
        <div>
            <h3>Sincronización de Datos</h3>
            <p>Esta tarea se gestiona con el `TaskManager` global.</p>
            <button onClick={handleManualSync}>Sincronizar Datos Ahora</button>
        </div>
    );
}
```

-----

### useValidator

Crea y mantiene una instancia de `ValidatorController` durante el ciclo de vida de un componente. Es el punto de partida para gestionar validaciones de formularios.

### Parámetros

  * **`model`** (opcional): El objeto de modelo inicial para el validador.

### Valores de Retorno

Retorna una tupla `[validator, model]`:

1.  **`validator: ValidatorController<T>`**: La instancia del controlador de validador.
2.  **`model: T | undefined`**: El modelo pasado como parámetro.

### Ejemplo de Uso

```typescript
function RegistrationForm() {
    const [formState, setFormState] = useState({ name: '', email: '' });
    const [validator] = useValidator(formState);

    // Lógica para vincular el validador a los campos del formulario...
    return <form>{/* ... */}</form>;
}
```

-----

### useValidatorModel

Este es un hook de conveniencia que combina `useValidator` y la inicialización del modelo en un solo paso. Es ideal cuando el modelo ya está disponible en el momento en que se renderiza el componente.

### Parámetros

  * **`model`**: El objeto de modelo inicial para el validador. A diferencia de `useValidator`, este parámetro es obligatorio.

### Valores de Retorno

Retorna una tupla `[validator, model]`:

1.  **`validator: ValidatorController<T>`**: La instancia del controlador de validador.
2.  **`model: T`**: El modelo pasado como parámetro, devuelto para mayor conveniencia.

### Ejemplo de Uso

```typescript
function UserProfile({ initialData }) {
    // initialData es el modelo que ya tenemos
    const [validator, model] = useValidatorModel(initialData);

    // ... la lógica del formulario sigue aquí
    return <form>{/* ... */}</form>;
}
```

-----

### useValidatorJoin

Un hook esencial para formularios anidados. Crea un nuevo `ValidatorController` (hijo) y lo une automáticamente a un validador padre en una propiedad específica (`key`). La validación del padre dependerá del resultado de la validación del hijo.

### Parámetros

  * **`key`**: La clave en el modelo del validador padre donde se anidará la validación del hijo.
  * **`validator`**: La instancia del `ValidatorController` padre.

### Valores de Retorno

Retorna una tupla `[newValidator]`:

1.  **`newValidator: ValidatorController<T>`**: La nueva instancia del validador hijo.

### Ejemplo de Uso

```typescript
// Componente hijo (ej. AddressForm.tsx)
function AddressForm({ parentValidator }) {
    const [addressState, setAddressState] = useState({ street: '', city: '' });
    // Une este validador a la propiedad 'address' del validador padre
    const [addressValidator] = useValidatorJoin('address', parentValidator);
    
    useEffect(() => {
        addressValidator.setModel(addressState);
    }, [addressState]);

    // ... campos para calle y ciudad usando 'addressValidator'
}

// Componente padre (ej. UserForm.tsx)
function UserForm() {
    const [userState, setUserState] = useState({ name: '', address: null });
    const [userValidator] = useValidator(userState);

    return (
        <form>
            {/* ... campo para el nombre del usuario */}
            <AddressForm parentValidator={userValidator} />
        </form>
    );
}
```

-----

### useArray

Un hook de utilidad para gestionar arrays en el estado de React. Proporciona métodos convenientes para operaciones CRUD (Crear, Leer, Actualizar, Eliminar) que actualizan la vista automáticamente, evitando la manipulación manual del estado del array.

### Parámetros

  * **`data`**: El array inicial (la referencia original que será mutada).
  * **`create`**: Una función factoría que define cómo crear nuevos elementos del tipo `T`.

### Valores de Retorno

Retorna un objeto con métodos que, al ser llamados, devuelven una función lista para ser usada en callbacks (ej. `onClick`):

  * **`array: T[]`**: El array actual (estado reactivo).
  * **`create(parent?: P)`**: Añade un nuevo elemento al final del array.
  * **`createByIndex(index: number, parent?: P)`**: Inserta un nuevo elemento en una posición específica.
  * **`remove(item: T)`**: Elimina un elemento específico por su referencia.
  * **`removeByIndex(index: number)`**: Elimina un elemento por su índice.
  * **`update(item: T)`**: Actualiza un elemento por su referencia.
  * **`updateByIndex(index: number, item: T)`**: Reemplaza un elemento en un índice dado.
  * **`updateAll(callback: (item: T) => T)`**: Actualiza todos los elementos usando un callback (similar a `map`).
  * **`move(from: number, to: number)`**: Mueve un elemento de una posición a otra.
  * **`getArray()`**: Devuelve la referencia al array original mutable.

### Ejemplo de Uso

```typescript
function TodoList() {
    // Es buena práctica usar useRef para mantener la referencia original del array
    const initialTodos = useRef<Todo[]>([]).current;
    const todoManager = useArray(initialTodos, () => ({ id: Date.now(), text: 'Nueva tarea' }));

    return (
        <div>
            <button onClick={todoManager.create()}>Añadir Tarea</button>
            <ul>
                {todoManager.array.map((todo, index) => (
                    <li key={todo.id}>
                        {todo.text}
                        <button onClick={todoManager.removeByIndex(index)}>Eliminar</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
```

-----

## Consideraciones de Desarrollo

  * **Rendimiento y Ejecución**: Por defecto, `emit` y `broadcastEmit` ejecutan los escuchadores de forma **secuencial**. Si necesitas ejecución paralela para mejorar el rendimiento en tareas independientes, utiliza `emitParallel` o `broadcastEmitParallel`.
  * **Manejo de Errores**:
      *   **Por defecto (`onError: 'break'`)**: Si un escuchador lanza una excepción, la ejecución se detiene y la promesa del evento se rechaza.
      *   **Modo Continuo (`onError: 'continue'`)**: Puedes configurar un evento para que continúe ejecutando los siguientes escuchadores aunque uno falle:
          ```typescript
          const myEvent = appEvents.createEvent("myEvent", { onError: 'continue' })<[]>();
          ```
      *   **Ejecución Segura (`emitSettled`)**: Utiliza los métodos `*Settled` para obtener un reporte detallado de la ejecución (`EmitResult`) que incluye tanto los resultados exitosos como una lista de errores con contexto (`EventErrorContext`), evitando bloques `try-catch` externos.
  * **Depuración**: Utiliza el modo de depuración (`isDebugModeOn` en `GroupEvent` o `setDebug` en `ValidatorController`) para obtener logs útiles en la consola.
  * **Integración con React**: Los hooks y la provisión de `SubscriberControllerReact` facilitan la reactividad de tus componentes con observables. Recuerda manejar el ciclo de vida de las suscripciones (desuscribirse en el cleanup de `useEffect`) para evitar fugas de memoria.