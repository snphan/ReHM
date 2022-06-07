import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./scss/dashboard.scss";

function Example() {
    const [count, setCount] = useState(0);
    let happy: string = "im happy";
    console.log(happy)
    return (
        <div>
            <p>You clicked {count} times. Good job hihi! Wow this is actually working!</p>
            <button
                className="btn btn-primary" 
                onClick={() => setCount(count + 1)}>
                Click me
            </button>
        </div>
    )
}


const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Example/>)
