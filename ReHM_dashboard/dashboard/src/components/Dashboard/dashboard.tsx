import React, { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
import 'chartjs-adapter-moment';
import "./react-grid-layout-styles.css"
import "./react-resizeable-styles.css"
import "./dashboard.scss";
import { Responsive, WidthProvider } from "react-grid-layout";


const ResponsiveReactGridLayout = WidthProvider(Responsive);

Chart.register(CategoryScale);

interface LayoutObject {
    i: string,
    x: number,
    y: number,
    w: number,
    h: number,
    static?: boolean
}

interface ChartData {
    [key: string] : {
        datasets: Array<{
            label: string,
            borderColor?: string,
            data: Array<{x: number, y: number}>
        }>
    }
}

/**
 * Data structure for one Datapoint. This data structure can be very quickly be inserted into NoSQL/SQL DB.
 *      - Device + DataType will be used to select or create the graph.
 *      - Data is an array with the assumption that the length is equal to the number of plots on the graph.
 *          For Example ACCEL has ACCEL X, ACCEL Y and ACCEL Z. [0.1, 0.2, 10]
 *          For Heart rate: [0.1]
 */     
interface DataPoint {
    device: string,         // Apple Watch, Fitbit, Polar, Pozxy 
    dataType: string,       // HR, RR, ACCEL, GYRO, POS
    timestamp: number,      // UNIX TIMESTAMP
    dataValues: Array<number>          // For data that comes as a pack (ACCEL) index 0 = x, 1 = y, 2 = z.
}

export default function Dashboard() {
    const isMobile: boolean = window.innerWidth <= 1024;
    const sidebarWidth: number = 12; // in rem during Desktop
    const sidebarHeight: number = 6; // in rem during Desktop

    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);
    const [allData, setAllData] = useState<ChartData | null>({});
    const [layout, setGridLayout] = useState<Array<LayoutObject> | null>([]);

    // ComponentDidMount()...
    useEffect(() => {
        // TODO: Layout will be set first by an API call given a specific patient.
        // For now we hardcode it. Need a way to template different datatypes (ACCEL has XYZ and HR only has one.)
        let myLayout: Array<LayoutObject> = [
            { i: "HR", x: 0, y: 0, w: 3, h: 3, static: false },
            { i: "ACCEL", x: 3, y: 0, w: 3, h: 3, static: false },
            { i: "TEMP", x: 6, y: 0, w: 3, h: 3, static: false },
        ]

        setGridLayout(myLayout);    // Had an issue with this, it seems like the callback onLayoutChange 
                                    // took the initial state and overrides this setState.
                                    // Solution: Call callback only if there are items in the layout.

        // After setting the layout, we need to construct the skeleton for allData State.
        let allDataSkeleton: ChartData = {};
        myLayout.forEach((layoutItem) => {
            if (layoutItem.i === "ACCEL") {
                allDataSkeleton[layoutItem.i] = {
                    datasets: [{
                        label: layoutItem.i+"_X",
                        borderColor: "red",
                        data: []
                    },
                    {
                        label: layoutItem.i+"_Y",
                        borderColor: "green",
                        data: []
                    },
                    {
                        label: layoutItem.i+"_Z",
                        borderColor: "blue",
                        data: []
                    }]
                }  
            } else {
                allDataSkeleton[layoutItem.i] = {
                    datasets: [{
                        label: layoutItem.i,
                        borderColor: "red",
                        data: []
                    }]
                }  
            }
        });

        setAllData(allDataSkeleton);
    }, []);

    // Helper Functions

    /**
     * Toggle the draggability of the graphs on the dashboard.
     * @param layout Current layout state
     * @returns new layout with static toggled on or off
     */
    const toggleStatic = (layout: Array<LayoutObject>) => {
        console.log(layout)
        var newLayout = layout.map(l => {
            return {...l, static: !l.static}
        })
        return newLayout;
    }

    // TODO: Add support for multiple devices that overlay on the graph. 
    // (Maybe not data with x,y,z though because that's a mess).
    /**
     * Add data to the graphs, currently only supports one device
     * @param dataPoints datapoints that conform to the DataPoint format
     */
    const addData = (dataPoints: Array<DataPoint>) => {
        const newData = JSON.parse(JSON.stringify(allData)); // Make a deep clone so that Chart Js Updates

        dataPoints.forEach((dataPoint) => {
            dataPoint.dataValues.forEach((value, i) => {
                // User should only see the data that there is a graph for.
                if (dataPoint.dataType in newData) {
                    newData[dataPoint.dataType].datasets[i].data.push({x: dataPoint.timestamp, y: value});
                }
            })
        })

        setAllData(newData);
    }


    return (
        <div className="dashboard-container d-flex justify-content-between">
            <div data-testid="menu" className={"menu sidebar "+ (showLeft ? "" : "hidden")}>
                <div>menu</div>
            </div>
            <div data-testid="dashboard-content" className="dashboard-content d-flex flex-fill flex-column" style={
                    isMobile ? 
                        {maxHeight: (showLeft && showRight ? `calc(100vh - ${2*sidebarHeight}rem`
                                     : showLeft || showRight ? `calc(100vh - ${sidebarHeight}rem`
                                     : "100vh")}
                    :
                        {maxWidth: (showLeft && showRight ? `calc(100vw - ${2*sidebarWidth}rem`
                                     : showLeft || showRight ? `calc(100vw - ${sidebarWidth}rem`
                                     : "100vw")}
                }>
                <div className="title d-flex">
                    <h1>Patient | {JSON.parse(document.getElementById("patient_id").textContent)}</h1>
                    <button data-testid="show-menu" onClick={() => setShowLeft(!showLeft)}>Show left</button>
                    <button data-testid="show-devices" onClick={() => setShowRight(!showRight)}>Show Right</button>
                    <button data-testid="toggle-dashboard-lock" onClick={() => setGridLayout(toggleStatic(layout))}>Lock/Unlock Dashboard</button>
                </div>
                <div className="graph-container">
                    <ResponsiveReactGridLayout
                        className="layout m-4"
                        layouts={{lg: layout}}
                        measureBeforeMount={false}
                        onLayoutChange={(newLayout, newLayouts) => {newLayout.length ? setGridLayout(newLayout) : null;}}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                        >
                            {layout.length ? layout.map(layoutItem => {
                                return (
                                    <div key={layoutItem.i} className="">
                                        <Line data={allData[layoutItem.i]} 
                                            options={{
                                                scales: {
                                                    x: {
                                                        type: 'time',
                                                        time: {
                                                            unit: 'second',
                                                        }
                                                    }
                                                }
                                            }}/>
                                        {/* Won't be a button, but rather a websocket that updates this.*/}
                                        {layoutItem.i == "ACCEL" ? 
                                            <button onClick={() => {
                                                let newData: DataPoint = {
                                                    device: "Fitbit",
                                                    dataType: layoutItem.i,
                                                    timestamp: Date.now(),
                                                    dataValues: [Math.random(), Math.random(), Math.random()],
                                                }
                                                addData([newData]);
                                            }}>Add Data</button>
                                        :
                                            <button onClick={() => {
                                                let newData: DataPoint = {
                                                    device: "Fitbit",
                                                    dataType: layoutItem.i,
                                                    timestamp: Date.now(),
                                                    dataValues: [Math.random()],
                                                }
                                                addData([newData]);
                                            }}>Add Data</button>
                                        }
                                    </div>)
                            }) : null}
                    </ResponsiveReactGridLayout>

                </div>
            </div>
            <div data-testid="devices" className={"devices sidebar " + (showRight ? "" : "hidden")}>
                <div>Devices and Search</div>
            </div>
        </div>
    )
}
