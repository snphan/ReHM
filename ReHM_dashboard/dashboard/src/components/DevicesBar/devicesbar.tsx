import React, { useState, useEffect } from "react";
import { LayoutObject } from "../Dashboard/dashboard";

interface Devices {
    [key: string]: {
        [datatypeKey: string]: {
            show: boolean
        }
    }
}

interface DataType {
    name: string,
    units: string,
    axes: Array<string>
}

export function DevicesBar(props: any) {
    const [currentDevices, setCurrentDevices] = useState<Devices | null>(null);

    useEffect(() => {
        let newDevices: Devices = {};
        props.gridLayout.forEach((layout: LayoutObject) => {
            const { deviceType, i, show } = layout;
            if (!(deviceType in newDevices)) {
                newDevices[deviceType] = {}
                newDevices[deviceType][i] = {show: show}
            } else {
                newDevices[deviceType][i] = {show: show}
            }
        })
        setCurrentDevices(newDevices);
    }, [props.gridLayout])

    return (
        <div>
        {currentDevices ? Object.keys(currentDevices).map((deviceName: string, index: number) => {
            return (    
            <div key={index} className="d-flex flex-column align-items-left m-2">
                <h4>{deviceName}</h4>
                {Object.keys(currentDevices[deviceName]).map((dataTypeName: string) => {
                    return (<DataCheckBox 
                        key={deviceName+dataTypeName}
                        selected={currentDevices[deviceName][dataTypeName].show}
                        dataType={dataTypeName}
                        device={deviceName}
                        gridLayout={props.gridLayout}
                        setGridLayout={props.setGridLayout}/>
                    )
                })}
            </div>
            )
        }) : null}
        </div>
    )
}


function DataCheckBox(props: any) {

    const [isChecked, setIsChecked] = useState<boolean | null>(props.selected);

    const handleOnChange = () => {
        setIsChecked(!isChecked);
        // Query the gridLayout by the
        let changedGridSettingsIndex = props.gridLayout.findIndex((item: LayoutObject) => {
            return (item.deviceType==props.device && item.i==props.dataType)
        }) 
        let newLayout = JSON.parse(JSON.stringify(props.gridLayout));
        let currentItem = {...newLayout[changedGridSettingsIndex]};
        currentItem.show = !currentItem.show;
        newLayout[changedGridSettingsIndex] = currentItem;
        props.setGridLayout(newLayout);
    }

    return (
       <div className="m-2">
            <input 
                type="checkbox" 
                id={props.device+props.dataType}
                checked={isChecked} 
                onChange={handleOnChange}
                />
            <label className="ms-2" htmlFor={props.device+props.dataType}>
                {props.dataType}
            </label>
       </div> 
    )

}