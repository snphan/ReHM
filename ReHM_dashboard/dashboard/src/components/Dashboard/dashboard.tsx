
import React, { useState } from "react";
import "./dashboard.scss";

export default function Dashboard() {
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);
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
                <div className="graph-container">
                    content
                </div>
            </div>
            <div data-testid="devices" className={"devices sidebar " + (showRight ? "" : "hidden")}>
                <div>Devices and Search</div>
            </div>
        </div>
    )
}
