import { useState } from "react";
import { Outlet } from "react-router";

import Sidebar from "./components/layout/Sidebar";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0b1014]">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-w-0 flex-1">
        

        <Outlet />
      </div>
    </div>
  );
}

export default App;