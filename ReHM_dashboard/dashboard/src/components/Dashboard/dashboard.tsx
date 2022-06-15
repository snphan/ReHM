import React, { useState, useEffect, useRef } from "react";
import { useMeasure } from "react-use";
import { Line } from "react-chartjs-2";
import { CategoryScale } from "chart.js";
import Chart from "chart.js/auto";
import 'chartjs-adapter-moment';
import { Responsive as ResponsiveReactGridLayout } from "react-grid-layout";
import axios from "axios";

import "./react-grid-layout-styles.css"
import "./react-resizeable-styles.css"
import "./dashboard.scss";




axios.defaults.xsrfHeaderName = "X-CSRFToken"; // so that post requests don't get rejected
const csrftokenPattern = /(csrftoken=[\d\w]+);?/g;
const csrftoken = document.cookie.match(csrftokenPattern) ? 
                    document.cookie.match(csrftokenPattern)[0].replace('csrftoken=', ''): null;

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
        datasets: Array<ChartDataset> | null
    }
}

interface ChartDataset {
    label: string,
    borderColor?: string,
    backgroundColor?: string,
    data: Array<{x: number, y: number}>
}

/**
 * Data structure for one Datapoint. This data structure can be very quickly be inserted into NoSQL/SQL DB.
 *      - Device + DataType will be used to select or create the graph.
 *      - Data is an array with the assumption that the length is equal to the number of plots on the graph.
 *          For Example ACCEL has ACCEL X, ACCEL Y and ACCEL Z. [0.1, 0.2, 10]
 *          For Heart rate: [0.1]
 */     
interface DataPoint {
    device: string,             // Apple Watch, Fitbit, Polar, Pozxy 
    dataType: string,           // HR, RR, ACCEL, GYRO, POS
    timestamp: number,          // UNIX TIMESTAMP
    dataValues: Array<number>   // For data that comes as a pack (ACCEL) index 0 = x, 1 = y, 2 = z.
}

export default function Dashboard() {
    const isMobile: boolean = window.innerWidth <= 1024;
    const sidebarWidth: number = 12; // in rem during Desktop
    const sidebarHeight: number = 6; // in rem during Desktop
    const plotColors: Array<string> = ["#ff64bd", "#b887ff", "#8be9fd", "#50fa7b", "#ffb86c"];

    const [gridContainerTarget, {x, y, width, height, top, right, bottom, left}] = useMeasure();

    const [showLeft, setShowLeft] = useState<boolean>(false);
    const [showRight, setShowRight] = useState<boolean>(false);

    const [currentProvider, setCurrentProvider] = useState(null)
    const [currentPatient, setCurrentPatient] = useState<number>(null); // Patient selection may be lumped into SPA
    useEffect(() => {
        setCurrentPatient(parseInt(document.getElementById("patient_id").textContent));        
        setCurrentProvider(parseInt(document.getElementById("user_id").textContent));        
    }, [])
    useEffect(() => {
        // Get the layout information from the provider_id, and patient_id query.
        if (currentProvider && currentPatient) {
            axios
                .get(`/accounts/api/gridlayout/?provider=${currentProvider}&patient=${currentPatient}`)
                .then((res) => {
                    let cleanedLayout: LayoutObject[] = [];
                    res.data.forEach((gridLayoutData: any) => {
                        cleanedLayout.push(
                            {
                                i: gridLayoutData.i,
                                x: gridLayoutData.x,
                                y: gridLayoutData.y,
                                w: gridLayoutData.w,
                                h: gridLayoutData.h,
                                static: gridLayoutData.static,
                            }
                        )
                    })
                    setGridLayout(cleanedLayout);
                    // Had an issue with this, it seems like the callback onLayoutChange 
                    // took the initial state and overrides this setState.
                    // Solution: Call callback only if there are items in the layout.
                });
            axios
                .get(`/accounts/api/user_info/${currentProvider}/`)
                .then((res) => {
                    setAllUserInfo(res.data);
                })
        }
    }, [currentPatient, currentProvider])

    const [allData, setAllData] = useState<ChartData | null>({});
    const [gridLayout, setGridLayout] = useState<Array<LayoutObject> | null>([]);
    const [allUserInfo, setAllUserInfo] = useState(null);
    useEffect(() => {

        if (gridLayout && allUserInfo && Object.keys(allData).length === 0) {
            // After setting the layout, we need to construct the skeleton for allData State.
            // Available Datatypes contains Axis information for each datatype.
            const  { available_datatypes } = allUserInfo
            let allDataSkeleton: ChartData = {};
            gridLayout.forEach((layoutItem) => {
                let currentDataType = layoutItem.i;
                allDataSkeleton[currentDataType] = {datasets: []}
                available_datatypes[currentDataType].forEach((axis: String, ind: number) => {

                    allDataSkeleton[currentDataType]["datasets"].push(
                        {
                            label: currentDataType + (axis === "none" ? '' : `_${axis}`.toUpperCase()),
                            borderColor: plotColors[ind],
                            backgroundColor: plotColors[ind] + "80", // 50% transparency for hexadecimal
                            data: []
                        }
                    )
                })
            })
            setAllData(allDataSkeleton);
        }
    }, [gridLayout, allUserInfo]);

    
    // Update configuration after locking
    const [saveLayout, setSaveLayout] = useState<boolean | null>(false);
    useEffect(() => {
        if (saveLayout) {
            if (allUserInfo.patients) {
                gridLayout.forEach(layout => {
                    let layoutToSave: any = (({i, x, y, w, h}) => ({i, x, y, w, h}))(layout)
                    layoutToSave['static'] = true; // static is reserved so we can't unpack
                    layoutToSave['patient'] = currentPatient;
                    layoutToSave['provider'] = currentProvider;

                    const layoutId = allUserInfo.patients.filter((obj: { provider: number; patient: number; i: string; })  => {
                        return obj.provider === currentProvider && obj.patient === currentPatient && obj.i === layout.i
                    })[0].id
                
                    axios.put(`/accounts/api/gridlayout/${layoutId}/`, layoutToSave, {
                        headers: {
                            'X-CSRFToken': csrftoken,
                            'Content-Type': 'application/json'
                        }
                    });
                })
            }
        }
    }, [saveLayout])



    // Helper Functions

    /**
     * Toggle the draggability of the graphs on the dashboard.
     * @param layout Current layout state
     * @returns new layout with static toggled on or off
     */
    const toggleStatic = (layout: Array<LayoutObject>) => {
        let newLayout = layout.map(l => {
            return {...l, static: !l.static}
        })
        if (newLayout) setSaveLayout(newLayout[0].static);
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
                    <button data-testid="toggle-dashboard-lock" onClick={() => setGridLayout(toggleStatic(gridLayout))}>Lock/Unlock Dashboard</button>
                </div>
                <div ref={gridContainerTarget} className="graph-container">
                        <ResponsiveReactGridLayout
                            className="layout m-4"
                            layouts={{lg: gridLayout}}
                            width={width - 56} // TODO: Currently Bandaid patch small screen vs large screen gridcontainer width
                            onLayoutChange={(newLayout, newLayouts) => { 
                                newLayout.length ? setGridLayout(newLayout) : null; 
                            }}
                            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                            >
                                {gridLayout.length && Object.keys(allData).length ? gridLayout.map(layoutItem => {
                                    return (
                                        <div key={layoutItem.i} className="" data-testid="one-graph">
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
