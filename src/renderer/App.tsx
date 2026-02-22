import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Today from './pages/Today';
import Weekly from './pages/Weekly';
import History from './pages/History';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="drag-region h-8 flex-shrink-0 bg-transparent" />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/weekly" element={<Weekly />} />
            <Route path="/history" element={<History />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
