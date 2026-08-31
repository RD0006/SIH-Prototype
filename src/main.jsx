import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";

import App from "./App";
import Dashboard from "./pages/Dashboard";
import Surveillance from "./pages/Surveillance";
import Incidents from "./pages/Incidents";

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
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);