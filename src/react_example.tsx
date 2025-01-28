import React, { FunctionComponent, useEffect, useState } from "react";
import * as Rdom from "react-dom"
import GroupEvent, { EventController } from ".";

interface ListnerExampleProps {
    changeTitle: EventController<[data: string]>
}

const ListenerExample: FunctionComponent<ListnerExampleProps> = ({ changeTitle }) => {
    const [onChangeTitle] = useState(changeTitle.createListener());
    const [value, setValue] = useState<string>("");

    useEffect(() => {
        //onUpdate
        onChangeTitle.on((data) => {
            setValue(data);
        })
        return () => {
            //onWillUnmount
            onChangeTitle.remove();
        }
    })

    return (<>
        <h3>{value}</h3>
    </>);
}


interface EmiterExampleProps {
    changeTitle: EventController<[data: string]>
}

const EmiterExample: FunctionComponent<EmiterExampleProps> = ({ changeTitle }) => {

    return (<>
        <input type="text" onChange={(e) => changeTitle.emit(e.target.value)}></input>
    </>);
}

const GroupEventExample: FunctionComponent = () => {
    const [events] = useState(new GroupEvent);
    const [changeTitle] = useState(events.createEvent("changeTitle")<[data: string]>())

    return <>
        <ListenerExample changeTitle={changeTitle} />
        <EmiterExample changeTitle={changeTitle} />
    </>
}


function App() {
    return <>
        <GroupEventExample />
    </>
}

Rdom.createPortal(<App />, document.getElementById("root")!);




















