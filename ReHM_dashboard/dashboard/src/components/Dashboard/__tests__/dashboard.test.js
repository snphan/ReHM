import React, { useState } from "react";
import ReactDOM from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import "../dashboard.scss";
import Dashboard from "../dashboard";

import { render, fireEvent, getByTestId } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";

let container;
let patient_id;


beforeEach(() => {
  container = document.createElement('div');
  patient_id = document.createElement('script');
  patient_id.id = "patient_id";
  patient_id.type = "application/json";
  patient_id.innerHTML = "\"hi\"";
  document.body.appendChild(patient_id);
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
  document.body.removeChild(patient_id);
  container = null;
  patient_id = null;
});

it("renders without crashing", () => {
  act(() => {
    ReactDOM.createRoot(container).render(<Dashboard />);
  });
})

it("renders dashboard-content correctly", () => {
  act(() => {
    ReactDOM.createRoot(container).render(<Dashboard />);
  });
  const dashboardContent = getByTestId(container, "dashboard-content");

  // Title should display with the patient_id
  expect(dashboardContent).toHaveTextContent("Patient | hi");

  // Should have 2 containers for the title and the dashboard content
  const dashboardContentChildren = dashboardContent.childNodes;
  expect(dashboardContentChildren.length).toBe(2);
})

it("shows sidebars correctly", () => {
  act(() => {
    ReactDOM.createRoot(container).render(<Dashboard />);
  });

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