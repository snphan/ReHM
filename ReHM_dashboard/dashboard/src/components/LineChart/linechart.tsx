import React, { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import { Chart } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import 'chartjs-adapter-moment';

Chart.register(zoomPlugin);

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
          parsing: false,
          plugins: {
            zoom: {
              pan: {
                enabled: true,
                modifierKey: 'alt',
              },
              zoom: {
                wheel: {
                  enabled: true,
                  modifierKey: 'alt',
                },
                pinch: {
                  enabled: true
                },
                mode: 'xy',
                overScaleMode: 'xy',
              }
            },
            decimation: {
              enabled: true,
              algorithm: 'lttb',
              samples: 500,
              threshold: 500
            }
          }
        }} />
    </div>)
}