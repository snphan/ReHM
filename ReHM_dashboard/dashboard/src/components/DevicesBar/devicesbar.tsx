import React, { useState, useEffect } from "react";

interface Device {
    name: string,
    dataType: Array<DataType>
}

interface DataType {
    name: string,
    units: string,
    axes: Array<string>
}

export function DevicesBar(props: any) {

    return (
        <div>
        {props.devices.map((device: Device, index: number) => {
            return (    
            <div key={device.name} className="d-flex flex-column align-items-left m-2">
                <h4>{device.name}</h4>
                {device.dataType.map((oneDataType: DataType) => {
                    return (<DataCheckBox 
                        key={device.name+oneDataType.name}
                        selected={true}
                        dataType={oneDataType}
                        device={device.name}/>
                    )
                })}
            </div>
        )
        })}

        </div>
    )
}


function DataCheckBox(props: any) {

    const [isChecked, setIsChecked] = useState<boolean | null>(props.selected);

    useEffect(() => {
        console.log(`${props.dataType.name} ${isChecked}`);
    }, [isChecked])
    const handleOnChange = () => {
        setIsChecked(!isChecked);
    }

    return (
       <div className="m-2">
            <input 
                type="checkbox" 
                id={props.name+props.dataType.name}
                checked={isChecked} 
                onChange={handleOnChange}
                />
            <label className="ms-2" htmlFor={props.name+props.dataType.name}>
                {props.dataType.name}
            </label>
       </div> 
    )

}