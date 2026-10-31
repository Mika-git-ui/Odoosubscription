import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  CalendarDays,
  FileCheck2,
  FileText,
  Receipt,
  CreditCard,
  Percent,
  Calculator,
  Zap,
  BarChart3,
  UserCog,
  Settings,
  Search,
  BookOpen,
  UserCircle,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_CONFIG = {
  ADMIN: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Subscription Plans', path: '/plans', icon: CalendarDays },
    { label: 'Subscriptions', path: '/subscriptions', icon: FileCheck2 },
    { label: 'Quotations', path: '/quotations', icon: FileText },
    { label: 'Invoices', path: '/invoices', icon: Receipt },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Discounts', path: '/discounts', icon: Percent },
    { label: 'Tax Rules', path: '/tax-rules', icon: Calculator },
    { label: 'Billing Centre', path: '/billing-centre', icon: Zap },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'User Management', path: '/users', icon: UserCog },
    { label: 'Settings', path: '/settings', icon: Settings },
  ],
  STAFF: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Subscriptions', path: '/subscriptions', icon: FileCheck2 },
    { label: 'Quotations', path: '/quotations', icon: FileText },
    { label: 'Invoices', path: '/invoices', icon: Receipt },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Billing Centre', path: '/billing-centre', icon: Zap },
    { label: 'Settings', path: '/settings', icon: Settings },
  ],
  CUSTOMER: [
    { label: 'Dashboard', path: '/my-dashboard', icon: LayoutDashboard },
    { label: 'My Subscriptions', path: '/my-subscriptions', icon: BookOpen },
    { label: 'My Invoices', path: '/my-invoices', icon: Receipt },
    { label: 'Payment History', path: '/payment-history', icon: CreditCard },
    { label: 'My Profile', path: '/profile', icon: UserCircle },
  ],
};

export const Sidebar = ({ isOpen = true, onClose }) => {
  const { user, logout } = useAuth();
  const currentRole = (user?.role || 'CUSTOMER').toUpperCase();
  const navItems = NAV_CONFIG[currentRole] || NAV_CONFIG.CUSTOMER;

  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const filteredItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: '#111827',
        color: '#9CA3AF',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        flexShrink: 0,
        borderRight: '1px solid #1F2937',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '1.25rem 1.25rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #7952CC 0%, #9F7AEA 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1rem',
            boxShadow: '0 2px 8px rgba(121, 82, 204, 0.4)',
          }}
        >
          R
        </div>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
            Revora
          </h2>
          <span style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {currentRole} WORKSPACE
          </span>
        </div>
      </div>

      {/* Sidebar Search Bar matching Reference Screenshot */}
      <div style={{ padding: '0 1rem 0.75rem' }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#1F2937',
            borderRadius: '6px',
            padding: '0.4rem 0.65rem',
            border: '1px solid #374151',
          }}
        >
          <Search size={14} color="#6B7280" style={{ marginRight: '6px', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F3F4F6',
              fontSize: '0.75rem',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Navigation Items */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.25rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '0.55rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#FFFFFF' : '#9CA3AF',
                backgroundColor: isActive ? '#1F2937' : 'transparent',
                borderLeft: isActive ? '3px solid #7952CC' : '3px solid transparent',
                transition: 'all 120ms ease-in-out',
                textDecoration: 'none',
              })}
            >
              <Icon size={16} color="inherit" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Area: Theme Pill Switcher & Sign Out */}
      <div
        style={{
          padding: '0.85rem 1rem',
          borderTop: '1px solid #1F2937',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Light / Dark Mode Toggle Pill matching Reference Screenshot */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#1F2937',
            padding: '4px 8px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            color: '#9CA3AF',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 500, color: !isDarkMode ? '#FFFFFF' : '#6B7280' }}>
            Light
          </span>
          <div
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              width: '36px',
              height: '18px',
              backgroundColor: '#374151',
              borderRadius: '9999px',
              position: 'relative',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
          >
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#7952CC',
                transform: isDarkMode ? 'translateX(18px)' : 'translateX(0)',
                transition: 'transform 150ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isDarkMode ? <Moon size={8} color="#FFF" /> : <Sun size={8} color="#FFF" />}
            </div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 500, color: isDarkMode ? '#FFFFFF' : '#6B7280' }}>
            Dark
          </span>
        </div>

        {/* User Profile & Sign Out */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: '#374151',
                color: '#E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#E5E7EB',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '110px',
              }}
            >
              {user?.full_name || user?.email || 'User'}
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sign out"
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
