import React, { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

export const Dropdown = ({
  trigger,
  items = [],
  children,
  align = 'right',
  width = '190px',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div className="dropdown-container" ref={containerRef}>
      <div onClick={toggle} style={{ display: 'inline-flex' }}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className="dropdown-menu"
          style={{
            minWidth: width,
            right: align === 'right' ? 0 : 'auto',
            left: align === 'left' ? 0 : 'auto',
          }}
        >
          {children
            ? children
            : items.map((item, idx) => {
                if (item.divider) {
                  return <div key={`divider-${idx}`} className="dropdown-divider" />;
                }

                const Icon = item.icon;

                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    className={`dropdown-item ${item.active ? 'active' : ''}`}
                    style={item.danger ? { color: '#E05252' } : {}}
                    onClick={() => {
                      if (item.onClick) item.onClick();
                      setIsOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {Icon && <Icon size={14} />}
                      <span>{item.label}</span>
                    </div>
                    {item.active && <Check size={14} color="#7952CC" />}
                  </button>
                );
              })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
