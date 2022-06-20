import React from "react";
import Dashboard from "./components/Dashboard/dashboard";
import { createRoot } from "react-dom/client";


const container = document.getElementById("root");
const root = createRoot(container);
root.render(
<React.StrictMode>
    <Dashboard/>
</React.StrictMode>)
