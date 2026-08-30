import { Outlet } from "react-router";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

export default function App() {
  return (
    <div className="min-h-screen bg-[#111418] text-slate-200">
      <Sidebar />

      <div className="ml-64">
        <Header />

        <main className="min-h-[calc(100vh-5rem)] p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}