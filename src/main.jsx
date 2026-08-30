import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";

import App from "./App";
import Dashboard from "./pages/Dashboard";
import Surveillance from "./pages/Surveillance";
import Incidents from "./pages/Incidents";
import Tracking from "./pages/Tracking";
import BorderMap from "./pages/Map";
import Evidence from "./pages/Evidence";
import SystemStatus from "./pages/SystemStatus";

import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "surveillance",
        element: <Surveillance />,
      },
      {
        path: "incidents",
        element: <Incidents />,
      },
      {
        path: "tracking",
        element: <Tracking />,
      },
      {
        path: "map",
        element: <BorderMap />,
      },
      {
        path: "evidence",
        element: <Evidence />,
      },
      {
        path: "system",
        element: <SystemStatus />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
    <RouterProvider router={router} />
);