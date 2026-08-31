import { Outlet } from "react-router";

import Sidebar from "./components/layout/Sidebar";

function App() {
  return (
    <div className="min-h-screen bg-[#090e12]">
      <Sidebar />

      <main className="min-h-screen lg:ml-[250px]">
        <div className="p-4 pt-20 sm:p-6 lg:p-8 lg:pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default App;