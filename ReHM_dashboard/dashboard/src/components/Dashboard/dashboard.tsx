
import React, { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
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

function toggleStatic(layout: Array<LayoutObject>){
    var newLayout = layout.map(l => {
           return {...l, static: !l.static}
    })
    return newLayout;
}

export default function Dashboard() {
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);
    const [testData, setTestData] = useState({
        labels: ['Test'],
        datasets: [{
            label: 'HR',
            data: [
                {x: '2021-11-06 23:39:30', y: 20},
                {x: '2021-11-06 23:40:30', y: 20},
                {x: '2021-11-06 23:41:30', y: 20},
                {x: '2021-11-06 23:42:30', y: 20},
                {x: '2021-11-06 23:43:30', y: 20},
            ]
        }],
    });
    const [layout, setLayout] = useState<Array<LayoutObject> | null>([
      { i: "a", x: 0, y: 0, w: 3, h: 3, static: false },
      { i: "b", x: 3, y: 0, w: 3, h: 3, static: false },
      { i: "c", x: 6, y: 0, w: 3, h: 3, static: false }
    ]);

    const layouts = {
        lg: layout,
    }

    const isMobile: boolean = window.innerWidth <= 1024;
    const sidebarWidth: number = 12; // in rem during Desktop
    const sidebarHeight: number = 6; // in rem during Desktop

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
                    <button data-testid="toggle-dashboard-lock" onClick={() => setLayout(toggleStatic(layout))}>Lock/Unlock Dashboard</button>
                </div>
                <div className="graph-container">
                    <ResponsiveReactGridLayout
                        className="layout m-4"
                        layouts={layouts}
                        measureBeforeMount={false}
                        onLayoutChange={(newLayout, newLayouts) => setLayout(newLayout)}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                        >
                            <div key="a" className="">
                                <Line data={testData}/>
                            </div>
                            <div key="b" className="">
                                <Line data={testData}/>
                            </div>
                            <div key="c" className="">
                                <Line data={testData}/>
                            </div>
                    </ResponsiveReactGridLayout>

                </div>
            </div>
            <div data-testid="devices" className={"devices sidebar " + (showRight ? "" : "hidden")}>
                <div>Devices and Search</div>
            </div>
        </div>
    )
}
