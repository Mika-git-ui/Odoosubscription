import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#F5F6F8',
      }}
    >
      {/* Dark Sidebar matching Reference Screenshot */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflowX: 'hidden',
        }}
      >
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main
          style={{
            flex: 1,
            padding: '1.75rem 2rem',
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
