import React from "react";
import ReactDOM from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import "../dashboard.scss";
import Dashboard from "../dashboard";

import { render, fireEvent, getByTestId, screen, getByText, findByText } from "@testing-library/react";
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/extend-expect";

import axios from "axios";

global.ResizeObserver = require('resize-observer-polyfill');

let container;
let patient_id;
let user_id;
let mockLayout = [
  { i: "HR", x: 0, y: 0, w: 3, h: 3, static: false },
  { i: "ACCEL", x: 3, y: 0, w: 3, h: 3, static: false },
];
let mockUserInfo = {
  available_datatypes: {
    HR: ["none"],
    ACCEL: ["x", "y", "z"]
  },
  device_types: [
    { dataType: ["ACCEL", "HR"], name: "Fitbit Versa 3" },
    { dataType: ["ACCEL", "HR"], name: "Apple Watch 7" },
  ]
}

jest.mock("axios");

beforeEach(async () => {
  container = document.createElement('div');
  patient_id = document.createElement('script');
  patient_id.id = "patient_id";
  patient_id.type = "application/json";
  patient_id.innerHTML = 1;
  user_id = document.createElement('script');
  user_id.id = "user_id";
  user_id.type = "application/json";
  user_id.innerHTML = 1;
  document.body.appendChild(patient_id);
  document.body.appendChild(user_id);
  document.body.appendChild(container);

  // Mock axios.get()
  axios.get
    .mockResolvedValueOnce({ data: mockLayout })
    .mockResolvedValueOnce({ data: mockUserInfo })
  await act(async () => { // Async Await solves the "update was not wrapped in act()" 
    ReactDOM.createRoot(container).render(<Dashboard />);
  });
});

afterEach(() => {
  document.body.removeChild(container);
  document.body.removeChild(patient_id);
  container = null;
  patient_id = null;
  user_id = null;
});

it("renders without crashing", () => { })

it("renders dashboard-content correctly", () => {
  const dashboardContent = getByTestId(container, "dashboard-content");

  // Title should display with the patient_id
  expect(dashboardContent).toHaveTextContent("Patient | 1");

  // Should have 2 containers for the title and the dashboard content
  const dashboardContentChildren = dashboardContent.childNodes;
  expect(dashboardContentChildren.length).toBe(2);
})

it("shows sidebars correctly", () => {

  const menuSidebar = getByTestId(container, "menu");
  const devicesSidebar = getByTestId(container, "devices");
  const showMenuButton = getByTestId(container, "show-menu");
  const showDevicesButton = getByTestId(container, "show-devices");

  // Sidebars should be hidden at first
  expect(menuSidebar).toHaveClass("hidden");
  expect(devicesSidebar).toHaveClass("hidden");

  // // Click the buttons and check if hidden gets taken off
  fireEvent.click(showMenuButton);
  fireEvent.click(showDevicesButton);

  expect(menuSidebar).not.toHaveClass("hidden");
  expect(devicesSidebar).not.toHaveClass("hidden");
})

it("calls lock/unlock dashboard correctly", async () => {
  // Click the toggle lock button
  const toggleDashboardLockBtn = getByTestId(container, "toggle-dashboard-lock");
  let gridItem = await container.getElementsByClassName("react-grid-item")[0];
  expect(gridItem.className).not.toContain("static")

  fireEvent.click(toggleDashboardLockBtn);

  // Check if the dashboard components are locked
  expect(gridItem.className).toContain("static")
})