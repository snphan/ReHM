import React, { useState, useEffect, useRef } from "react";
import { useMeasure } from "react-use";
import { Line } from "react-chartjs-2";
import { CategoryScale } from "chart.js";
import Chart from "chart.js/auto";
import 'chartjs-adapter-moment';

interface DataPoint {
    device: string,             // Apple Watch, Fitbit, Polar, Pozxy 
    dataType: string,           // HR, RR, ACCEL, GYRO, POS
    timestamp: number,          // UNIX TIMESTAMP
    dataValues: Array<number>   // For data that comes as a pack (ACCEL) index 0 = x, 1 = y, 2 = z.
}

interface LineChartProps {
    layoutItem: any,
    allData: any,
    addData: any
}

export function LineChart(props: LineChartProps) {
    return (
        <div data-testid="one-graph">
            <Line data={props.allData[props.layoutItem.i]} 
                options={{
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'second',
                            }
                        }
                    }
                }}/>
            {props.layoutItem.i == "ACCEL" ? 
                <button onClick={() => {
                    let newData: DataPoint = {
                        device: "Fitbit",
                        dataType: props.layoutItem.i,
                        timestamp: Date.now(),
                        dataValues: [Math.random(), Math.random(), Math.random()],
                    }
                    props.addData([newData]);
                }}>Add Data</button>
            :
                <button onClick={() => {
                    let newData: DataPoint = {
                        device: "Fitbit",
                        dataType: props.layoutItem.i,
                        timestamp: Date.now(),
                        dataValues: [Math.random()],
                    }
                    props.addData([newData]);
                }}>Add Data</button>
            }
        </div>)
}