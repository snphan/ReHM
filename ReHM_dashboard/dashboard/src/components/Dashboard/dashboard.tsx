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

import { LineChart } from "../LineChart/linechart";
import { DevicesBar } from "../DevicesBar/devicesbar";
import { NavBar } from "../NavBar/navbar"

axios.defaults.xsrfHeaderName = "X-CSRFToken"; // so that post requests don't get rejected
const csrftokenPattern = /(csrftoken=[\d\w]+);?/g;
const csrftoken = document.cookie.match(csrftokenPattern) ? 
                    document.cookie.match(csrftokenPattern)[0].replace('csrftoken=', ''): null;

Chart.register(CategoryScale);

export interface LayoutObject {
    i: string,
    x: number,
    y: number,
    w: number,
    h: number,
    static?: boolean
    deviceType: string,
    show: boolean
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

interface NavBarItem {
    title: string,
    imgSource: string,
    link: string
}
export default function Dashboard() {
    const isMobile: boolean = window.innerWidth <= 1024;
    const sidebarWidth: number = 12; // in rem during Desktop
    const sidebarHeight: number = 6; // in rem during Desktop
    const plotColors: Array<string> = ["#ff64bd", "#b887ff", "#8be9fd", "#50fa7b", "#ffb86c"];
    const navBarItems: NavBarItem[] = [
        {
            imgSource:"/static/dashboard/pictures/home.svg/",
            link: "/dashboard/",
            title: "Home"
        },
        {
            imgSource:"/static/dashboard/pictures/settings.svg/",
            link: "/dashboard/",
            title: "Settings"
        },
        {
            imgSource:"/static/dashboard/pictures/profile.svg/",
            link: "/dashboard/",
            title: "Profile"
        },
        {
            imgSource:"/static/dashboard/pictures/list.svg/",
            link: "/dashboard/",
            title: "Patients"
        },
    ]

    const [showLeft, setShowLeft] = useState<boolean>(false);
    const [showRight, setShowRight] = useState<boolean>(false);
    const [gridContainerTarget, {x, y, width, height, top, right, bottom, left}] = useMeasure();
    const [currentProvider, setCurrentProvider] = useState(null)
    const [currentPatient, setCurrentPatient] = useState<number>(null); // Patient selection may be lumped into SPA
    const [allData, setAllData] = useState<ChartData | null>({});
    const [gridLayout, setGridLayout] = useState<Array<LayoutObject> | null>([]);
    const [allUserInfo, setAllUserInfo] = useState(null);
    const [saveLayout, setSaveLayout] = useState<boolean | null>(false);

    // The Websocket to listen for data coming in to the current patient
    const [dataSocket, setDataSocket] = useState<WebSocket | null>(null)
    useEffect(() => {
        if (dataSocket) {
            dataSocket.onmessage = function(e) {
                const data = JSON.parse(e.data);
                console.log(data);
            }

            dataSocket.onclose = function(e) {
                // console.error("Data Socket closed unexpectedly");
            }
        }
    }, [dataSocket])

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
                    // Data for the Grid Layout
                    res.data.forEach((gridLayoutData: any) => {
                        cleanedLayout.push(
                            {
                                i: gridLayoutData.i,
                                x: gridLayoutData.x,
                                y: gridLayoutData.y,
                                w: gridLayoutData.w,
                                h: gridLayoutData.h,
                                static: gridLayoutData.static,
                                deviceType: gridLayoutData.deviceType,
                                show: gridLayoutData.show
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

        // Upgrade to websocket after currentPatient has been set.
        setDataSocket(new WebSocket(
                'ws://'
                + window.location.host
                + '/ws/data/'
                + currentPatient
                + '/'
            ));

        }
    }, [currentPatient, currentProvider])

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
    useEffect(() => {
        if (saveLayout) {
            if (allUserInfo.patients) {
                gridLayout.forEach(layout => {
                    let layoutToSave: any = (({i, x, y, w, h, show, deviceType}) => ({i, x, y, w, h, show, deviceType}))(layout)
                    layoutToSave['static'] = true; // static is reserved in JS language so we can't unpack
                    layoutToSave['patient'] = currentPatient;
                    layoutToSave['provider'] = currentProvider;
                        
                    console.log(layout);
                    console.log(allUserInfo.patients);
                    const layoutId = allUserInfo.patients.filter((obj: { provider_id: number; patient_id: number; i_id: string; })  => {
                        return obj.provider_id === currentProvider && obj.patient_id === currentPatient && obj.i_id === layout.i
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
                    let oneDataPoint = {x: dataPoint.timestamp, y: value}
                    newData[dataPoint.dataType].datasets[i].data.push(oneDataPoint);

                    // DEBUG WEBSOCKET
                    if (dataSocket !== null) {
                        dataSocket.send(JSON.stringify({'message': oneDataPoint}))
                    }
                }
            })
        })
        setAllData(newData);
    }

    const handleLayoutChange = (newLayout: ReactGridLayout.Layout[]) => {

        if (newLayout.length) {
            let layoutToSet: LayoutObject[] = []
            newLayout.forEach((layout, index) => {
                // Relies on the gridlayout indexing to be same as newLayout indexing
                let layoutObj = {
                    i: layout.i,
                    x: layout.x,
                    y: layout.y,
                    w: layout.w,
                    h: layout.h,
                    static: layout.static,
                    deviceType: gridLayout[index].deviceType, 
                    show: gridLayout[index].show
                }
                layoutToSet.push(layoutObj);
            })
            setGridLayout(layoutToSet);
        }
    }

    return (
        <div className="dashboard-container d-flex justify-content-between">
            <div data-testid="menu" className={"menu sidebar "+ (showLeft ? "" : "hidden")}>
                <NavBar items={navBarItems}></NavBar>
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
                <div className="title d-flex align-items-center">
                    <button data-testid="show-menu" className="noformat" onClick={() => setShowLeft(!showLeft)}>
                        {!showLeft ?
                            <img className="navbar-toggle-icon" src="/static/dashboard/pictures/menu.svg" alt="" />
                        :
                            <img className="navbar-toggle-icon" src="/static/dashboard/pictures/close.svg" alt="" />
                        }
                    </button>
                    <h1 className="title-text">Patient | {JSON.parse(document.getElementById("patient_id").textContent)}</h1>
                    <button data-testid="show-devices" onClick={() => setShowRight(!showRight)}>Show Right</button>
                    <button data-testid="toggle-dashboard-lock" onClick={() => setGridLayout(toggleStatic(gridLayout))}>Lock/Unlock Dashboard</button>
                </div>
                <div ref={gridContainerTarget} className="graph-container">
                        {gridLayout.length && Object.keys(allData).length ?
                            <ResponsiveReactGridLayout
                                className="layout m-4"
                                layouts={{lg: gridLayout}}
                                width={width - 56} // TODO: Currently Bandaid patch small screen vs large screen gridcontainer width
                                onLayoutChange={handleLayoutChange}
                                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                                >
                                    {gridLayout.map(layoutItem => {
                                        return (
                                            <div key={layoutItem.i}>
                                                <LineChart layoutItem={layoutItem} allData={allData} addData={addData}/>
                                            </div>
                                        )
                                    })}
                            </ResponsiveReactGridLayout>
                        : null}
                </div>
            </div>
            <div data-testid="devices" className={"devices sidebar " + (showRight ? "" : "hidden")}>

                {gridLayout.length == 0 ?
                null
                : 
                <DevicesBar
                    gridLayout={gridLayout}
                    setGridLayout={setGridLayout}
                ></DevicesBar>
                }
            </div>
        </div>
    )
}
