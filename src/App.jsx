import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  Calendar,
  Receipt,
  CreditCard,
  Plus,
  BookOpen,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  const pythonCourses = [
    { level: 'Basic Level', fee: '₹999 / mo', syllabus: 'Core Syntax, Variables, Control Flow, Functions & OOP Basics', students: 12 },
    { level: 'Intermediate Level', fee: '₹1,999 / mo', syllabus: 'Data Structures, Algorithms, FastAPI REST APIs & Async I/O', students: 24 },
    { level: 'Advanced Level', fee: '₹3,499 / mo', syllabus: 'Distributed Systems, Concurrency, Performance Tuning & ML', students: 8 },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: '240px', background: '#ffffff', borderRight: '1px solid var(--border)', padding: '1.5rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', paddingLeft: '0.5rem' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--primary)', color: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            R
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Revora</h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Subscription Management</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            className="btn"
            style={{ justifyContent: 'flex-start', background: activeTab === 'overview' ? '#eff6ff' : 'transparent', color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-main)' }}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={16} /> Overview
          </button>
          <button
            className="btn"
            style={{ justifyContent: 'flex-start', background: activeTab === 'courses' ? '#eff6ff' : 'transparent', color: activeTab === 'courses' ? 'var(--primary)' : 'var(--text-main)' }}
            onClick={() => setActiveTab('courses')}
          >
            <BookOpen size={16} /> Python Courses
          </button>
          <button
            className="btn"
            style={{ justifyContent: 'flex-start', background: activeTab === 'customers' ? '#eff6ff' : 'transparent', color: activeTab === 'customers' ? 'var(--primary)' : 'var(--text-main)' }}
            onClick={() => setActiveTab('customers')}
          >
            <Users size={16} /> Customers
          </button>
          <button
            className="btn"
            style={{ justifyContent: 'flex-start', background: activeTab === 'invoices' ? '#eff6ff' : 'transparent', color: activeTab === 'invoices' ? 'var(--primary)' : 'var(--text-main)' }}
            onClick={() => setActiveTab('invoices')}
          >
            <Receipt size={16} /> Invoices
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem 2.5rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Subscription Hub</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Brightloop &bull; Revora Subscription Platform</p>
          </div>
          <button className="btn btn-primary">
            <Plus size={16} /> New Subscription
          </button>
        </header>

        {/* KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Recurring Revenue</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 0' }} className="num-tabular">₹87,956.00</div>
            <span style={{ fontSize: '0.75rem', color: '#059669' }}>Active recurring subscriptions</span>
          </div>

          <div className="card">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Enrolled Students</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 0' }} className="num-tabular">44 Learners</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across 3 Python tiers</span>
          </div>

          <div className="card">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Invoices Due Today</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 0' }} className="num-tabular">3 Invoices</div>
            <span style={{ fontSize: '0.75rem', color: '#92400e' }}>Ready for automated billing run</span>
          </div>
        </div>

        {/* Python Course Levels Card */}
        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Python Programming Masterclass Tiers</h3>
            <span className="badge badge-active">Active Curriculum</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {pythonCourses.map((c, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '1rem', background: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{c.level}</strong>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{c.fee}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', minHeight: '38px' }}>
                  {c.syllabus}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 500 }}>
                  Active Enrolled: <span className="num-tabular font-bold">{c.students} students</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
