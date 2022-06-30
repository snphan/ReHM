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

export function DataTypeSelectionBar(props: any) {

    return (
        <div className="devices-bar">
            {props.gridLayout.map((layout: LayoutObject) => {
                return (
                    <DataTypeCheckBox
                        key={layout.i}
                        dataType={layout.i}
                        gridLayout={props.gridLayout}
                        setGridLayout={props.setGridLayout}
                        selected={layout.show}
                    />
                )
            })
            }
        </div>
    )
}


function DataTypeCheckBox(props: any) {

    const [isChecked, setIsChecked] = useState<boolean | null>(props.selected);

    const handleOnChange = () => {
        setIsChecked(!isChecked);
        // Query the gridLayout by the
        let changedGridSettingsIndex = props.gridLayout.findIndex((item: LayoutObject) => {
            return (item.i==props.dataType)
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
                id={props.dataType}
                checked={isChecked} 
                onChange={handleOnChange}
                />
            <label className="ms-2" htmlFor={props.dataType}>
                {props.dataType}
            </label>
       </div> 
    )

}