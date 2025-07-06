Aquí tienes la documentación completa y unificada de la librería Eventer, incluyendo los hooks de React.

-----

# Documentación de la Librería Eventer

Eventer es una librería de gestión de eventos robusta y versátil para TypeScript, diseñada para facilitar la comunicación entre componentes, la gestión de estados reactivos y la orquestación de tareas asíncronas en aplicaciones JavaScript. Proporciona una API rica y tipada que abarca desde eventos simples hasta patrones más complejos como observables, loaders, managers de tareas y validadores de formularios, e incluye hooks de React para una integración fluida.

-----

## Instalación

```bash
npm install eventer
```

-----

## Uso Básico

Para comenzar, importa la función `eventer` y crea una instancia de `GroupEvent`:

```typescript
import { eventer } from "eventer";

const appEvents = eventer("myApp"); // "myApp" es un prefijo opcional para los nombres de eventos, útil para depuración.
```

-----

## Tipos de Controladores y Funcionalidades

Eventer ofrece varios tipos de controladores, cada uno diseñado para un caso de uso específico:

### 1\. `ListenerController<Props, Returns, Description>`

El **`ListenerController`** es la interfaz fundamental para gestionar un único escuchador de eventos.

  * **`on(callback: (...props: Props) => Returns, doOneTime?: boolean): void`**: Modifica o asigna el callback que se ejecutará cuando se emita el evento.
      * `callback`: La función a ejecutar.
      * `doOneTime`: Si es `true`, el escuchador se eliminará automáticamente después de su primera ejecución.
  * **`remove(): void`**: Elimina el escuchador del evento.
  * **`state: Readonly<"idle" | "removed" | "running" | "willRemove" | "desattached" | "willAttach">`**: El estado actual del escuchador.
  * **`onRemoveEvent(callback: () => void): void`**: Registra un callback que se ejecutará cuando el escuchador sea eliminado.

-----

### 2\. `EventController<Props, Name>`

Permite crear y gestionar **eventos unidireccionales**. Son útiles para notificar a los suscriptores que algo ha ocurrido.

  * **`createEvent<Name extends PropertyKey>(name: Name)`**: Crea una factoría para un evento específico.

    ```typescript
    const userLoggedIn = appEvents.createEvent("userLoggedIn")<[userId: string, userName: string]>();
    ```

  * **`createListener(): ListenerController<Props, Promise<void> | void, Name>`**: Crea un escuchador único para este evento.

    ```typescript
    userLoggedIn.createListener().on((userId, userName) => {
        console.log(`Usuario ${userName} (${userId}) ha iniciado sesión.`);
    });
    ```

  * **`emit(...params: Props): Promise<void>`**: Emite el evento, ejecutando todos sus escuchadores.

    ```typescript
    await userLoggedIn.emit("123", "Alice");
    ```

  * **`removeEvent(): void`**: Elimina **todos** los escuchadores asociados a este evento.

-----

### 3\. `EventBrocastController<Props, Returns, Name>`

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

-----

### 4\. `EventObservableController<T, Name>`

Implementa un patrón **observable**, permitiendo que un valor sea observado y notifique a los suscriptores cuando cambie. Es similar a un `Subject` de RxJS.

  * **`createObservavble<Name extends string>(name: Name)`**: Crea una factoría para un observable.

    ```typescript
    const currentTheme = appEvents.createObservavble("theme")("light"); // Valor inicial "light"
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

### 5\. `LoaderController<Props, T, Description>`

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

### 6\. `TaskManager<TKey, Name>`

Permite **gestionar y ejecutar múltiples tareas asíncronas** de forma secuencial. Ideal para flujos de trabajo con dependencias o validaciones en cascada.

  * **`createTasksManager<TKey extends string = string, Name extends string = string>(name: Name)`**: Crea un manager de tareas.

    ```typescript
    const formSaveTasks = appEvents.createTasksManager("saveForm");
    ```

  * **`addTask(key: TKey, fun: () => Promise<any>): TaskManager<TKey>`**: Añade una tarea al manager con una clave única.

  * **`removeTask(key: TKey): TaskManager<TKey>`**: Elimina una tarea por su clave.

  * **`createTaskInstance(): Task<TKey>`**: Crea una instancia de tarea sin clave predefinida. La clave se asignará automáticamente (UUID) al llamar a `setTask`.

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

### 7\. `ValidatorController<Model, Name>`

Proporciona una estructura para la **validación de modelos de formularios**, integrando la reactividad y la gestión de eventos.

  * **`createValidator<Model extends object, Name extends string>(name: Name)`**: Crea un controlador de validador.

    ```typescript
    interface UserForm { name: string; email: string; }
    const userValidator = appEvents.createValidator<UserForm>("userForm");
    ```

  * **`setModel(model: Model): void`**: Establece el modelo completo a validar.

  * **`setPartialModel(model: Model): void`**: Actualiza el modelo parcialmente.

  * **`getProps(key: keyof Model, onChange?: (value: any) => void): FormProps`**: Obtiene las propiedades necesarias para vincular un campo del formulario (ej. `onChange`). El `onChange` interno incluye un *debounce* de 100ms.

      * **`FormProps`**: Contiene la propiedad `onChange`.

  * **` getEvents(): FormEventsController<Model,  `events of ${Name}`>`**: Obtiene un controlador para eventos del formulario.

      * **`FormEventsController`**:
          * **`listeners()`**: Contiene `createOnChangeListener()` para cuando una propiedad del modelo cambia.
          * **`getDisabled(): boolean` / `setDisabled(value: boolean): void`**: Para gestionar el estado `disabled` del formulario.
          * **`getFocused(): boolean` / `setFocused(value: boolean): void`**: Para gestionar el estado `focused` del formulario.
          * **`subscribers()`**: Contiene `createDisabledSubscriber()` y `createFocusedSubscriber()` para observar estos estados.

  * **`getModel(): Model | undefined`**: Obtiene el modelo actual.

  * **`doValidation(): Promise<boolean>`**: Ejecuta las validaciones. Envía un evento broadcast y recopila los resultados.

  * **`setDebug(value: boolean): void`**: Activa/desactiva el modo de depuración.

  * **`setTaskManager(v: TaskManager | null): void` / `getTaskManager(): TaskManager | null`**: Para asociar un `TaskManager` al validador.

  * **`listeners()`**: Proporciona escuchadores para eventos del validador.

      * **`createSetTaskManagerListener()`**: Cuando se establece el `TaskManager`.
      * **`createValidationBroadcastListener()`**: Se utiliza internamente para las validaciones.

-----

### 8\. `TimerController<CompleteParams, Name>`

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

## Hooks de React para Eventer

Eventer proporciona un conjunto de hooks de React para integrar fácilmente sus controladores de eventos y observables con el ciclo de vida de los componentes funcionales, permitiendo una gestión de estado y una comunicación entre componentes más **reactiva** y **declarativa**.

-----

### 1\. `useObservable<T>(observable?: ObservableOrSubscriberFunctionInstancer<T>, callback2?: (v: T) => void)`

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
import { eventer } from "../utilities/eventer";
import { useObservable } from "./your-hooks-file";

const appEvents = eventer();
const userNameObservable = appEvents.createObservavble("userName")("Invitado");

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

### 2\. `useListener<Props extends any[], Returns>(event: EventOrBrocastOrListenerFunctionInstancer<Props, Returns>, callback?: (...props: Props) => (EventOrBrocastOrListenerFunctionInstancer<Props, Returns> extends EventBrocastController<Props, Returns> ? Promise<Returns> : EventOrBrocastOrListenerFunctionInstancer<Props, Returns> extends EventBrocastController<Props, Returns>["createBroadcastListener"] ? Promise<Returns> : void))`

Este hook permite a un componente de React **escuchar eventos** creados con `EventController` o `EventBrocastController`, o directamente a un "listener instancer" (una función que crea un escuchador). El escuchador se registrará cuando el componente se monte y se limpiará automáticamente cuando el componente se desmonte.

### Parámetros

  * **`event`**: Una instancia de `EventController<Props>`, `EventBrocastController<Props, Returns>`, o una función que, al ser llamada (`event()`), retorna una instancia de `ListenerController`.
  * **`callback`** (opcional): La función que se ejecutará cuando el evento sea emitido. El tipo de retorno de este callback es inferido, permitiendo devolver `Promise<Returns>` para eventos broadcast y `void` para eventos normales.

### Valores de Retorno

  * Retorna `null`. Este hook está diseñado para efectos secundarios.

### Ejemplo de Uso

```typescript
import { eventer } from "../utilities/eventer";
import { useListener } from "./your-hooks-file";

const appEvents = eventer();
const userSavedEvent = appEvents.createEvent("userSaved")<[userId: string]>();

function UserStatusMessage() {
    useListener(userSavedEvent, (userId) => {
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

### 3\. `useGlobalTaskManager()`

Este hook proporciona acceso a una instancia global de **`TaskManager`**, preconfigurada para tu aplicación. Permite gestionar y orquestar secuencias de tareas asíncronas desde cualquier componente de forma centralizada.

### Valores de Retorno

  * Retorna la instancia global de `TaskManager`.

### Ejemplo de Uso

```typescript
import { useGlobalTaskManager } from "./your-hooks-file";

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

### 4\. `useTask(callback: () => Promise<void>, execute?: boolean)`

Este hook permite **crear una tarea asíncrona** y añadirla a la instancia global de `TaskManager`. Es útil para encapsular operaciones asíncronas dentro de un componente que deben ser gestionadas por un orquestador de tareas.

### Parámetros

  * **`callback`**: Una función asíncrona (`() => Promise<void>`) que representa la tarea a ejecutar.
  * **`execute`** (opcional): Si es `true`, el `taskManager` global intentará ejecutar todas las tareas pendientes inmediatamente después de que esta tarea sea añadida.

### Valores de Retorno

  * Retorna la instancia global de `TaskManager`.

### Ejemplo de Uso

```typescript
import { useTask, useGlobalTaskManager } from "./your-hooks-file";

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

## Consideraciones de Desarrollo

  * **Rendimiento en `emitAsync` y `broadcastEmitAsync`**: Los escuchadores se ejecutan de forma **secuencial** (`await` dentro de `reduce`). Esto asegura un orden predecible, pero si necesitas ejecución paralela para ciertos eventos, deberías considerar un patrón diferente (ej. `Promise.all`).
  * **Manejo de Errores**: Es fundamental que los `callbacks` de tus escuchadores manejen sus propios errores o que implementes un mecanismo global de captura de errores para eventos simples si no usas `LoaderController`.
  * **Depuración**: Utiliza el modo de depuración (`isDebugModeOn` en `GroupEvent` o `setDebug` en `ValidatorController`) para obtener logs útiles en la consola.
  * **Integración con React**: Los hooks y la provisión de `SubscriberControllerReact` facilitan la reactividad de tus componentes con observables. Recuerda manejar el ciclo de vida de las suscripciones (desuscribirse en el cleanup de `useEffect`) para evitar fugas de memoria.