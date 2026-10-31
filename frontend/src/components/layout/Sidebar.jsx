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
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import RevoraLogo from '../common/RevoraLogo';

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

export const Sidebar = ({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const currentRole = (user?.role || 'CUSTOMER').toUpperCase();
  const navItems = NAV_CONFIG[currentRole] || NAV_CONFIG.CUSTOMER;

  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          style={{ display: isOpen ? 'block' : 'none' }}
        />
      )}

      <aside
        className={`sidebar-wrapper sidebar-desktop ${isOpen ? 'sidebar-mobile-open' : ''}`}
        style={{
          width: isCollapsed ? '76px' : '250px',
          backgroundColor: 'var(--sidebar-bg)',
          color: 'var(--sidebar-text)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          flexShrink: 0,
          borderRight: '1px solid var(--sidebar-border)',
          transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: isCollapsed ? '1rem 0.5rem' : '1.25rem 1.25rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            position: 'relative',
          }}
        >
          {isCollapsed ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
              }}
            >
              <RevoraLogo size={34} />
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Expand sidebar"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <RevoraLogo size={34} />
                <div>
                  <h2
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Revora
                  </h2>
                  <span
                    style={{
                      fontSize: '9.5px',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: 600,
                    }}
                  >
                    {currentRole} WORKSPACE
                  </span>
                </div>
              </div>

              {/* Desktop Minimize Toggle Button */}
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Minimize sidebar"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B7280',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft size={16} />
              </button>
            </>
          )}

          {/* Mobile Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
                display: 'none',
              }}
              className="mobile-sidebar-toggle"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search Bar matching Reference Screenshot (Hidden when collapsed) */}
        {!isCollapsed && (
          <div style={{ padding: '0.75rem 1rem 0.5rem' }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--sidebar-search-bg)',
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
        )}

        {/* Navigation Items (Properly centered & visible in both states) */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isCollapsed ? '0.5rem 0.35rem' : '0.25rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: isCollapsed ? '4px' : '2px',
          }}
        >
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                title={item.label}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? '0' : '10px',
                  width: isCollapsed ? '46px' : 'auto',
                  height: isCollapsed ? '44px' : 'auto',
                  margin: isCollapsed ? '0 auto' : '0',
                  padding: isCollapsed ? '0' : '0.55rem 0.75rem',
                  borderRadius: isCollapsed ? '8px' : '6px',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#FFFFFF' : '#9CA3AF',
                  backgroundColor: isActive
                    ? isCollapsed
                      ? 'rgba(121, 82, 204, 0.25)'
                      : '#1F2937'
                    : 'transparent',
                  border:
                    isActive && isCollapsed
                      ? '1px solid rgba(121, 82, 204, 0.4)'
                      : '1px solid transparent',
                  borderLeft:
                    isActive && !isCollapsed
                      ? '3px solid #7952CC'
                      : !isCollapsed
                      ? '3px solid transparent'
                      : 'none',
                  transition: 'all 120ms ease-in-out',
                  textDecoration: 'none',
                })}
              >
                <Icon size={isCollapsed ? 20 : 17} color="inherit" style={{ flexShrink: 0 }} />
                {!isCollapsed && (
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Area: Dynamic Light / Dark Mode Toggle Pill & Sign Out */}
        <div
          style={{
            padding: isCollapsed ? '0.75rem 0.35rem' : '0.85rem 1rem',
            borderTop: '1px solid #1F2937',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Functional Light / Dark Mode Toggle Pill */}
          <div
            onClick={toggleTheme}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              backgroundColor: '#1F2937',
              padding: isCollapsed ? '6px' : '4px 8px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              color: '#9CA3AF',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 150ms ease',
            }}
          >
            {!isCollapsed && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: !isDark ? '#FFFFFF' : '#6B7280',
                }}
              >
                Light
              </span>
            )}

            <div
              style={{
                width: isCollapsed ? '28px' : '36px',
                height: isCollapsed ? '28px' : '18px',
                backgroundColor: '#374151',
                borderRadius: '9999px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
              }}
            >
              <div
                style={{
                  width: isCollapsed ? '22px' : '14px',
                  height: isCollapsed ? '22px' : '14px',
                  borderRadius: '50%',
                  backgroundColor: '#7952CC',
                  transform:
                    isCollapsed
                      ? 'none'
                      : isDark
                      ? 'translateX(18px)'
                      : 'translateX(0)',
                  transition: 'transform 150ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isDark ? <Moon size={isCollapsed ? 12 : 8} color="#FFF" /> : <Sun size={isCollapsed ? 12 : 8} color="#FFF" />}
              </div>
            </div>

            {!isCollapsed && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: isDark ? '#FFFFFF' : '#6B7280',
                }}
              >
                Dark
              </span>
            )}
          </div>

          {/* User Profile & Sign Out */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              paddingTop: '4px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflow: 'hidden',
              }}
              title={user?.full_name || user?.email || 'User'}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#374151',
                  color: '#E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>

              {!isCollapsed && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#E5E7EB',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '120px',
                  }}
                >
                  {user?.full_name || user?.email?.split('@')[0] || 'User'}
                </span>
              )}
            </div>

            {!isCollapsed && (
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
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
