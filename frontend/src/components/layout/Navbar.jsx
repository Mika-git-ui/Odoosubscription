import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Shield,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Settings,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Dropdown from '../common/Dropdown';
import RevoraLogo from '../common/RevoraLogo';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const role = (user?.role || 'Customer').toUpperCase();

  const getRoleBadgeStyle = (r) => {
    switch (r) {
      case 'ADMIN':
        return { bg: 'var(--primary-subtle)', text: 'var(--primary)', border: 'var(--primary-border)' };
      case 'STAFF':
        return { bg: 'var(--status-info-bg)', text: 'var(--status-info-text)', border: 'var(--status-info-border)' };
      case 'CUSTOMER':
      default:
        return { bg: 'var(--status-success-bg)', text: 'var(--status-success-text)', border: 'var(--status-success-border)' };
    }
  };

  const badge = getRoleBadgeStyle(role);

  const userMenuItems = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: UserCircle,
      onClick: () => navigate(role === 'CUSTOMER' ? '/profile' : '/settings'),
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      onClick: () => navigate('/settings'),
    },
    { divider: true },
    {
      id: 'theme',
      label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: isDark ? Sun : Moon,
      onClick: toggleTheme,
    },
    { divider: true },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: LogOut,
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <header
      style={{
        height: 'var(--navbar-height)',
        backgroundColor: 'var(--navbar-bg)',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        transition: 'background-color 150ms ease, border-color 150ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            style={{
              display: 'none',
              background: 'none',
              border: '1px solid var(--border-default)',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'var(--text-main)',
              padding: '6px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="mobile-sidebar-toggle"
            title="Toggle Menu"
          >
            <Menu size={18} />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RevoraLogo size={22} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Revora Platform
          </span>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Subscription & Masterclass Billing
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Role Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '9999px',
            backgroundColor: badge.bg,
            border: `1px solid ${badge.border}`,
            color: badge.text,
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <Shield size={12} />
          <span>{role}</span>
        </div>

        {/* Theme Quick Toggle Icon */}
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
          }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User Profile Dropdown Menu */}
        <Dropdown
          items={userMenuItems}
          align="right"
          width="210px"
          trigger={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingLeft: '8px',
                borderLeft: '1px solid var(--border-default)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    lineHeight: 1.2,
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.full_name || user?.email?.split('@')[0] || 'User'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {role}
                </span>
              </div>
              <ChevronDown size={14} color="var(--text-muted)" />
            </div>
          }
        />
      </div>
    </header>
  );
};

export default Navbar;
