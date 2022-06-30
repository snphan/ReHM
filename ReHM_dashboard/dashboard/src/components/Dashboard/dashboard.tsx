import React, { useState, useEffect, useRef } from "react";
import { useMeasure } from "react-use";
import { CategoryScale } from "chart.js";
import Chart from "chart.js/auto";
import 'chartjs-adapter-moment';
import { Responsive as ResponsiveReactGridLayout } from "react-grid-layout";
import axios from "axios";

import "./react-grid-layout-styles.css"
import "./react-resizeable-styles.css"
import "./dashboard.scss";

import { LineChart } from "../LineChart/linechart";
import { DataTypeSelectionBar } from "../DataTypeSelectionBar/datatypeselectionbar";
import { NavBar } from "../NavBar/navbar"

axios.defaults.xsrfHeaderName = "X-CSRFToken"; // so that post requests don't get rejected
const csrftokenPattern = /(csrftoken=[\d\w]+);?/g;
const csrftoken = document.cookie.match(csrftokenPattern)?.at(0)?.replace('csrftoken=', ''); // use .at(ind) for optional chaining

Chart.register(CategoryScale);

export interface LayoutObject {
  id: number,
  i: string,
  x: number,
  y: number,
  w: number,
  h: number,
  static?: boolean
  show: boolean
}

interface ChartData {
  [key: string]: {
    datasets: Array<ChartDataset> | null
  }
}

interface ChartDataset {
  label: string,
  borderColor?: string,
  backgroundColor?: string,
  data: Array<{ x: number, y: number }>
}

/**
 * Data structure for one Datapoint. This data structure can be very quickly be inserted into NoSQL/SQL DB.
 *      - Device + DataType will be used to select or create the graph.
 *      - Data is an array with the assumption that the length is equal to the number of plots on the graph.
 *          For Example ACCEL has ACCEL X, ACCEL Y and ACCEL Z. [0.1, 0.2, 10]
 *          For Heart rate: [0.1]
 */
interface DataPoint {
  device: string,             // Apple Watch, Fitbit, Polar, Pozxy 
  dataType: string,           // HR, RR, ACCEL, GYRO, POS
  timestamp: number,          // UNIX TIMESTAMP
  dataValues: Array<number>   // For data that comes as a pack (ACCEL) index 0 = x, 1 = y, 2 = z.
}

const isDataPoint = (object: any): object is DataPoint => {
  return (
    'device' in object &&
    'dataType' in object &&
    'timestamp' in object &&
    'dataValues' in object
  )
}

interface NavBarItem {
  title: string,
  imgSource: string,
  link: string
}

interface AvailableDatatypes {
  [key: string]: Array<string>
}

interface DeviceTypes {
  dataType: Array<string>,
  name: string
}

export default function Dashboard() {
  const isMobile: boolean = window.innerWidth <= 1024;
  const sidebarWidth: number = 12; // in rem during Desktop
  const sidebarHeight: number = 6; // in rem during Desktop
  const plotColors: Array<string> = ["#ff64bd", "#b887ff", "#8be9fd", "#50fa7b", "#ffb86c"];
  const navBarItems: NavBarItem[] = [
    {
      imgSource: "/static/dashboard/pictures/home.svg",
      link: "/dashboard/",
      title: "Home"
    },
    {
      imgSource: "/static/dashboard/pictures/settings.svg",
      link: "/dashboard/",
      title: "Settings"
    },
    {
      imgSource: "/static/dashboard/pictures/profile.svg",
      link: "/dashboard/",
      title: "Profile"
    },
    {
      imgSource: "/static/dashboard/pictures/list.svg",
      link: "/dashboard/",
      title: "Patients"
    },
  ]

  const [showLeft, setShowLeft] = useState<boolean>(false);
  const [showRight, setShowRight] = useState<boolean>(false);
  const [gridContainerTarget, { x, y, width, height, top, right, bottom, left }] = useMeasure<HTMLDivElement>();
  const [currentProvider, setCurrentProvider] = useState<number | null>(null)
  const [currentPatient, setCurrentPatient] = useState<number | null>(null); // Patient selection may be lumped into SPA
  const [allData, setAllData] = useState<ChartData>({});
  const [gridLayout, setGridLayout] = useState<Array<LayoutObject> | null>([]);
  const [gridIsLocked, setGridIsLocked] = useState<boolean | null>(false);
  const [allUserInfo, setAllUserInfo] = useState<any | null>(null);
  const [saveLayout, setSaveLayout] = useState<boolean | null>(false);
  const dataSocket = useRef<WebSocket | null>(null);

  //----------------------------------------------------------------------------------------------------
  // MARK: Initial Setup.
  useEffect(() => {
    setCurrentPatient(parseInt(document.getElementById("patient_id")?.textContent!));
    setCurrentProvider(parseInt(document.getElementById("user_id")?.textContent!));
  }, [])
  useEffect(() => {
    // Get the layout information from the provider_id, and patient_id query.
    if (currentProvider && currentPatient) {
      axios
        .get(`/accounts/api/gridlayout/?provider=${currentProvider}&patient=${currentPatient}`)
        .then((res) => {
          let cleanedLayout: LayoutObject[] = [];
          // Data for the Grid Layout
          res.data.forEach((gridLayoutData: any) => {
            cleanedLayout.push(
              {
                id: gridLayoutData.id,
                i: gridLayoutData.i,
                x: gridLayoutData.x,
                y: gridLayoutData.y,
                w: gridLayoutData.w,
                h: gridLayoutData.h,
                static: gridLayoutData.static,
                show: gridLayoutData.show
              }
            )
          })
          setGridLayout(cleanedLayout);
          // Had an issue with this, it seems like the callback onLayoutChange 
          // took the initial state and overrides this setState.
          // Solution: Call callback only if there are items in the layout.

          setGridIsLocked(cleanedLayout[0]?.static!);
        });
      axios
        .get(`/accounts/api/user_info/${currentProvider}/${currentPatient}/`)
        .then((res) => {
          setAllUserInfo(res.data);
        })

      dataSocket.current = new WebSocket(
        'ws://'
        + window.location.host
        + '/ws/data/'
        + currentPatient
        + '/')
      dataSocket.current.onclose = function (e: any) {
        // console.error("Data Socket closed unexpectedly");
      }
    }
  }, [currentPatient, currentProvider])

  // Construct the data structure for Chart.js
  useEffect(() => {
    if (gridLayout && allUserInfo && Object.keys(allData).length === 0) {
      // After setting the layout, we need to construct the skeleton for allData State.
      // Available Datatypes contains Axis information for each datatype.
      const { available_datatypes, device_types }:
        { available_datatypes: AvailableDatatypes, device_types: DeviceTypes[] } = allUserInfo
      let allDataSkeleton: ChartData = {};
      // Initialize an empty dataset
      Object.keys(available_datatypes).forEach((dataType) => {
        allDataSkeleton[dataType] = { datasets: [] };
      })

      // Use device_types to create plots for each Devices' datatype
      device_types.forEach((device) => {
        const { dataType, name } = device;
        dataType.forEach((currentDataType) => {
          available_datatypes[currentDataType].forEach((axis: string) => {
            let color = plotColors[allDataSkeleton[currentDataType]["datasets"].length] // Color selected depends on length of dataset
            let device_initials = name
              .split(' ')
              .map(word => word[0])
              .join('');
            allDataSkeleton[currentDataType]["datasets"]!.push(
              {
                label: currentDataType
                  + (axis === "none" ? '' : `_${axis}`.toUpperCase())
                  + `_${device_initials}`,
                borderColor: color,
                backgroundColor: color + "80", // 50% transparency for hexadecimal
                data: []
              }
            )
          })
        })
      })
      setAllData(allDataSkeleton);
    }
  }, [gridLayout, allUserInfo]);

  // We need to Update the DataSocket onmessage function everytime with the new 
  // allData or else allData will always be initial state of {}.
  useEffect(() => {
    if (dataSocket.current) {
      dataSocket.current.onmessage = handleInsertData;
    }
  }, [allData])
  //---------------------------------------------------------------------------------------------------- 

  const handleInsertData = (e: any) => {
    const data: Array<DataPoint> = JSON.parse(e.data)["message"];
    if (data.length === 0 || !data[0]) {
      console.log("No data")
      return
    }

    if (isDataPoint(data[0])) {
      addData(data);
    } else {
      console.log("Not a datapoint");
    }
  }

  // Update configuration after locking, Save layout is separate from gridLayout because we don't want to save
  // on every gridLayout Update.
  useEffect(() => {
    if (saveLayout) {
      gridLayout!.forEach(layout => {
        let layoutToSave: any = (({ id, i, x, y, w, h, show }) => ({ id, i, x, y, w, h, show }))(layout)
        layoutToSave['static'] = true; // static is reserved in JS language so we can't unpack
        layoutToSave['patient'] = currentPatient;
        layoutToSave['provider'] = currentProvider;

        axios.put(`/accounts/api/gridlayout/${layoutToSave.id}/`, layoutToSave, {
          headers: {
            'X-CSRFToken': csrftoken!,
            'Content-Type': 'application/json'
          }
        });
      })
    }
  }, [saveLayout])

  // Helper Functions

  /**
   * Toggle the draggability of the graphs on the dashboard.
   * @param layout Current layout state
   * @returns new layout with static toggled on or off
   */
  const toggleStatic = (layout: Array<LayoutObject>) => {
    let newLayout = layout.map(l => {
      return { ...l, static: !l.static }
    })
    if (newLayout) setSaveLayout(newLayout[0].static);
    if (newLayout) setGridIsLocked(newLayout[0].static);
    return newLayout;
  }

  /**
   * Add data to the graphs, data from different devices will overlay accordingly
   * @param dataPoints datapoints that conform to the DataPoint format
   */
  const addData = (dataPoints: Array<DataPoint>) => {
    const newData = JSON.parse(JSON.stringify(allData)); // Make a deep clone so that Chart Js Updates
    const { available_datatypes } = allUserInfo;

    // For each datapoint find the corresponding label and add to the dataset
    // with the correct label. Scales with number of devices (which shouldn't be too many)
    dataPoints.forEach((dataPoint) => {
      const { dataType, device } = dataPoint;
      dataPoint.dataValues.forEach((value, i) => {
        let axis = available_datatypes[dataType][i]
        let label: string = dataType
          + (axis === "none" ? '' : `_${axis}`.toUpperCase())
          + "_"
          + device.split(" ").map(word => word[0]).join('');

        let datasetIndex = newData[dataType].datasets.findIndex((dataset: ChartDataset) => {
          return dataset["label"] === label;
        })

        if (dataType in newData) {
          let oneDataPoint = { x: dataPoint.timestamp, y: value }
          newData[dataPoint.dataType].datasets[datasetIndex].data.push(oneDataPoint);
        }
      })
    })
    setAllData(newData);
  }

  const handleLayoutChange = (newLayout: ReactGridLayout.Layout[]) => {

    if (newLayout.length) {
      let layoutToSet: LayoutObject[] = []
      newLayout.forEach((layout, index) => {
        // Relies on the gridlayout indexing to be same as newLayout indexing
        let layoutObj = {
          id: gridLayout![index].id,
          i: layout.i,
          x: layout.x,
          y: layout.y,
          w: layout.w,
          h: layout.h,
          static: layout.static,
          show: gridLayout![index].show
        }
        layoutToSet.push(layoutObj);
      })
      setGridLayout(layoutToSet);
    }
  }

  const downloadChartData = () => {
    var data = JSON.stringify(allData, null, 2);
    const blob = new Blob([data], { type: "octet_stream" });
    const href = URL.createObjectURL(blob);

    const a = Object.assign(document.createElement('a'), {
      href,
      style: "display:none",
      download: "myData.json"
    });

    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(href)
    a.remove();
  }

  return (
    <div className="dashboard-container d-flex justify-content-between">
      {/* Menu Sidebar */}
      <div data-testid="menu" className={"menu sidebar " + (showLeft ? "" : "hidden")}>
        <NavBar items={navBarItems}></NavBar>
      </div>

      {/* Main content */}
      <div data-testid="dashboard-content" className="dashboard-content d-flex flex-fill flex-column">

        {/* Title Components */}
        <div className="title d-flex align-items-center mt-3">
          <button data-testid="show-menu" className="sidebar-toggle noformat mx-3" onClick={() => setShowLeft(!showLeft)}>
            {!showLeft ?
              <img className="navbar-toggle-icon" src="/static/dashboard/pictures/menu.svg" alt="" />
              :
              <img className="navbar-toggle-icon" src="/static/dashboard/pictures/close.svg" alt="" />
            }
          </button>
          <h1 className="title-text m-4">Patient | {JSON.parse(document.getElementById("patient_id")?.textContent!)}</h1>
          <button data-testid="download-btn" className="noformat ms-auto me-3" onClick={() => downloadChartData()}>
            <img className="navbar-toggle-icon" src="/static/dashboard/pictures/download.svg" alt="" />
          </button>
          <button data-testid="toggle-dashboard-lock" className="noformat mx-3" onClick={() => setGridLayout(toggleStatic(gridLayout!))}>
            {gridIsLocked ?
              <img className="navbar-toggle-icon" src="/static/dashboard/pictures/locked.svg" alt="" />
              :
              <img className="navbar-toggle-icon" src="/static/dashboard/pictures/lockopen.svg" alt="" />
            }
          </button>
          <button data-testid="show-devices" className="sidebar-toggle noformat mx-3" onClick={() => setShowRight(!showRight)}>
            {!showRight ?
              <img className="navbar-toggle-icon" src="/static/dashboard/pictures/watch.svg" alt="" />
              :
              <img className="navbar-toggle-icon" src="/static/dashboard/pictures/close.svg" alt="" />
            }
          </button>
        </div>

        {/* Graph Components */}
        <div ref={gridContainerTarget} className="graph-container">
          {gridLayout!.length && Object.keys(allData).length ?
            <ResponsiveReactGridLayout
              className="layout m-4"
              layouts={{ lg: gridLayout! }}
              width={width - 56} // TODO: Currently Bandaid patch small screen vs large screen gridcontainer width
              onLayoutChange={handleLayoutChange}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            >
              {gridLayout!.map(layoutItem => {
                let dataType: string = layoutItem.i
                return (
                  <div key={layoutItem.i} className={layoutItem.show ? "" : "hidden"}>
                    <LineChart allData={allData[dataType]} addData={addData} />
                  </div>
                )
              })}
            </ResponsiveReactGridLayout>
            : null}
        </div>
      </div>

      {/* Device Selection Bar */}
      <div data-testid="devices" className={"devices sidebar " + (showRight ? "" : "hidden")}>
        {gridLayout!.length == 0 ?
          null
          :
          <DataTypeSelectionBar
            gridLayout={gridLayout}
            setGridLayout={setGridLayout}
          ></DataTypeSelectionBar>
        }
      </div>
    </div>
  )
}
