import GroupEvent from "..";
//EventGroup instance

const events = new GroupEvent;

// create event

const myEvent = events.createEvent("MyEvent")<[data: string]>();


// create event listener

const listener1 = myEvent.createListener();

listener1.on((data) => {
    if (data == "hello")
        console.log("hello world");
})


// emit event and execute all listeners

myEvent.emit("hello");


// remove listener

listener1.remove();


// # Create Broadcast


const myBroad = events.createBroadcast("MyBroad")<[data: string], boolean>();


// create a listener

const myBroadListener1 = myBroad.createBroadcastListener();
const myBroadListener2 = myBroad.createBroadcastListener();

myBroadListener1.on((data) => {
    if (data == "ok")
        return true;
    return false;
})

myBroadListener2.on(data => {
    if (data == "ok")
        return false;
    return true;
})


// broadcast emit returns all listener result in a list in a Promise
// emit could return some undefined when the event its runingn in other instance.

myBroad.broadcastEmit("ok").then(result => {
    console.log(result?.some(d => d == true));
});


// remove broadcast listener

myBroadListener1.remove();
myBroadListener2.remove();


// create observable 

const myObservable = events.createObservavble("myvar")<boolean>(false);

// create subscribers

const mySub = myObservable.createSubscriber();

mySub.subscribe((value) => {
    console.log(value);
});


// set the value


myObservable.next(true);


// With removed solution and listeners states

// set param withRemovedSolution as true
const myEvent2 = events.createEvent("myevent2")<[]>(true);


let myListener1 = myEvent2.createListener();

console.log(myListener1.state) // "willAttach"

myListener1.on(() => {
    console.log(myListener1.state) // "running"
})

console.log(myListener1.state) // "idle"

myEvent2.emit();

myEvent2.removeEvent();

console.log(myListener1.state) // "desattached"

// solved: no throw error removed
myListener1.on(() => {
    myListener1.remove();
    console.log(myListener1.state) // "removed"
})

myEvent2.emit();

// throw error that event has removed couse is removed on 112 line
try {
    myListener1.on(() => {

    })

} catch {
    console.log(myListener1.state) // "desattached"

    myListener1 = myEvent2.createListener();

    console.log(myListener1.state) // "willAttach"

    myListener1.on(() => {
        console.log(myListener1.state) // "running"
    })

    console.log(myListener1.state) // "idle"
}


//loader
class MyModelService {
    private static events = new GroupEvent;

    public static getModelLoader = this.events.createLoader("getModel", async (/** define your params */) => {
        //get something from api       
        return await new Promise<string>((res) => {
            setTimeout(() => res("hola mundo"), 200);
        })
    }).readOnly();//the task could not be set.


}

const onGetModel = MyModelService.getModelLoader.listeners().createOnDoneListener();

onGetModel.on((data) => {
    console.log(data);
})

MyModelService.getModelLoader.exec();//run
MyModelService.getModelLoader.exec();//no run
MyModelService.getModelLoader.exec();//no run


//timers
const myTime = events.createTimer("mytime")<[data: string]>();

myTime.start(2000, 1, () => {
    return ["hola mundo"];
})

const onCompleted = myTime.listeners().createOnCompletedListener();
onCompleted.on((data) => {
    console.log(data); // hola mundo
});

const onProgress = myTime.listeners().createOnRunningListener();
onProgress.on((porcent, total, isStopped) => {
    console.log(porcent);
})