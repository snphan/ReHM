import React, { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import { Chart } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import 'chartjs-adapter-moment';

Chart.register(zoomPlugin);

interface DataPoint {
  device: string,             // Apple Watch, Fitbit, Polar, Pozxy 
  dataType: string,           // HR, RR, ACCEL, GYRO, POS
  timestamp: number,          // UNIX TIMESTAMP
  dataValues: Array<number>   // For data that comes as a pack (ACCEL) index 0 = x, 1 = y, 2 = z.
}

interface LineChartProps {
  allData: any,
  addData: any
}

export function LineChart(props: LineChartProps) {
  return (
    <div data-testid="one-graph">
      <Line data={props.allData}
        options={{
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'second',
              }
            }
          },
          datasets: {
            line: {
              pointRadius: 0
            }
          },
          elements: {
            point: {
              radius: 0
            }
          },
          animation: false,
          plugins: {
            zoom: {
              pan: {
                enabled: true,
                modifierKey: 'ctrl',
              },
              zoom: {
                wheel: {
                  enabled: true,
                  modifierKey: 'ctrl',
                },
                pinch: {
                  enabled: true
                },
                mode: 'xy',
                overScaleMode: 'xy',
              }
            }
          }
        }} />
    </div>)
}