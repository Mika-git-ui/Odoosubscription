import React from 'react';
import { Menu, Bell, User, Shield, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const role = (user?.role || 'Customer').toUpperCase();

  const getRoleBadgeStyle = (r) => {
    switch (r) {
      case 'ADMIN':
        return { bg: '#F3E8FF', text: '#7952CC', border: '#D8B4FE' };
      case 'STAFF':
        return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      case 'CUSTOMER':
      default:
        return { bg: '#ECFDF5', text: '#16A36A', border: '#A7F3D0' };
    }
  };

  const badge = getRoleBadgeStyle(role);

  return (
    <header
      style={{
        height: '60px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #EAECF0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#4B5563',
              padding: '4px',
            }}
            className="mobile-sidebar-toggle"
          >
            <Menu size={20} />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
            Brightloop Platform
          </span>
          <span style={{ color: '#D1D5DB' }}>/</span>
          <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
            Python Masterclass Billing
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

        {/* Notifications Icon */}
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: '#6B7280',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
          }}
          title="Notifications"
        >
          <Bell size={18} />
          <span
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#7952CC',
            }}
          />
        </button>

        {/* User initials & name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid #EAECF0' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#F3E8FF',
              color: '#7952CC',
              fontWeight: 700,
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827', lineHeight: 1.2 }}>
              {user?.full_name || user?.email?.split('@')[0] || 'User'}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
              {user?.email || 'user@revora.io'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
