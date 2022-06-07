import React from "react";
import {createRoot} from "react-dom/client";
import '../scss/test.scss'

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<h1>Hello from React!</h1>);