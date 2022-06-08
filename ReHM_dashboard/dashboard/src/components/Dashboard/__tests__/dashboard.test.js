import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "../dashboard.scss";
import Dashboard from "../dashboard";

it("renders without crashing", () => {
  const div = document.createElement("div");
  const root = createRoot(div);
  root.render(<Dashboard />)
})