
import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
import "./dashboard.scss";
Chart.register(CategoryScale);

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
                </div>
                <div className="graph-container d-flex flex-wrap flex-fill">
                    <div className="m-3" style={{width: "30rem", height: "20rem"}}>
                        <Line data={testData}/>
                    </div>
                    <div className="m-3" style={{width: "30rem", height: "20rem"}}>
                        <Line data={testData}/>
                    </div>
                    <div className="m-3" style={{width: "30rem", height: "20rem"}}>
                        <Line data={testData}/>
                    </div>
                    <div className="m-3" style={{width: "30rem", height: "20rem"}}>
                        <Line data={testData}/>
                    </div>
                    <div className="m-3" style={{width: "30rem", height: "20rem"}}>
                        <Line data={testData}/>
                    </div>
                    <div className="m-3" style={{width: "30rem", height: "20rem"}}>
                        <Line data={testData}/>
                    </div>
                    <div className="m-3" style={{width: "30rem", height: "20rem"}}>
                        <Line data={testData}/>
                    </div>
                    <div className="m-3" style={{width: "30rem", height: "20rem"}}>
                        <Line data={testData}/>
                    </div>
                    <div className="m-3" style={{width: "30rem", height: "20rem"}}>
                        <Line data={testData}/>
                    </div>
                    <div className="m-3" style={{width: "30rem", height: "20rem"}}>
                        <Line data={testData}/>
                    </div>
                </div>
            </div>
            <div data-testid="devices" className={"devices sidebar " + (showRight ? "" : "hidden")}>
                <div>Devices and Search</div>
            </div>
        </div>
    )
}
