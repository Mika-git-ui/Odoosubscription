import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import taxApi from '../../api/taxRules';
import userApi from '../../api/users';
import { Plus, Shield, Settings, UserCog, Calculator } from 'lucide-react';

export const SettingsView = () => {
  const [activeTab, setActiveTab] = useState('taxes'); // 'taxes' | 'users'

  // Tax state
  const [taxRules, setTaxRules] = useState([]);
  const [taxLoading, setTaxLoading] = useState(true);
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [taxFormData, setTaxFormData] = useState({ name: 'GST', rate_percent: '18' });

  // Users state
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'STAFF',
  });

  const fetchTaxes = async () => {
    setTaxLoading(true);
    try {
      const response = await taxApi.list();
      setTaxRules(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTaxLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const response = await userApi.list();
      setUsers(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'taxes') fetchTaxes();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const handleCreateTax = async (e) => {
    e.preventDefault();
    try {
      await taxApi.create({
        name: taxFormData.name,
        rate_percent: parseFloat(taxFormData.rate_percent) || 0,
      });
      setTaxModalOpen(false);
      fetchTaxes();
    } catch (err) {
      alert(`Tax rule creation failed: ${err.message}`);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await userApi.create(userFormData);
      setUserModalOpen(false);
      setUserFormData({ full_name: '', email: '', password: '', role: 'STAFF' });
      fetchUsers();
    } catch (err) {
      alert(`User creation failed: ${err.message}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="System Settings & Administration"
        subtitle="Manage taxation rates, compound tax rules, and team member accounts"
        breadcrumbs={['Home', 'Settings']}
      />

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'taxes' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('taxes')}
        >
          <Calculator size={14} /> Tax Rules (GST)
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('users')}
        >
          <UserCog size={14} /> User & Staff Management
        </button>
      </div>

      {activeTab === 'taxes' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setTaxModalOpen(true)}>
              Add Tax Rule
            </Button>
          </div>

          <DataTable
            columns={[
              { header: 'Tax Name', key: 'name', render: (r) => <strong style={{ color: 'var(--text-main)' }}>{r.name}</strong> },
              { header: 'Rate (%)', key: 'rate_percent', render: (r) => <span className="num-tabular font-bold">{r.rate_percent}%</span> },
              { header: 'Status', key: 'is_active', render: (r) => <StatusBadge status={r.is_active !== false ? 'ACTIVE' : 'CLOSED'} /> },
            ]}
            data={taxRules.length > 0 ? taxRules : [{ id: 1, name: 'Standard GST (Education / Tech)', rate_percent: 18, is_active: true }]}
            loading={taxLoading}
          />
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setUserModalOpen(true)}>
              Add Staff Member
            </Button>
          </div>

          <DataTable
            columns={[
              { header: 'Name', key: 'full_name', render: (r) => <strong style={{ color: 'var(--text-main)' }}>{r.full_name || r.name}</strong> },
              { header: 'Email', key: 'email' },
              { header: 'Role', key: 'role', render: (r) => <span className="badge badge-info">{r.role}</span> },
              { header: 'Status', key: 'is_active', render: (r) => <StatusBadge status={r.is_active !== false ? 'ACTIVE' : 'CLOSED'} /> },
            ]}
            data={
              users.length > 0
                ? users
                : [
                    { id: 1, full_name: 'System Administrator', email: 'admin@revora.io', role: 'ADMIN', is_active: true },
                    { id: 2, full_name: 'Billing Staff Member', email: 'staff@revora.io', role: 'STAFF', is_active: true },
                  ]
            }
            loading={userLoading}
          />
        </div>
      )}

      {/* Tax Modal */}
      <Modal
        isOpen={taxModalOpen}
        onClose={() => setTaxModalOpen(false)}
        title="Add Tax Rule"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTaxModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateTax}>Save Tax Rule</Button>
          </>
        }
      >
        <form onSubmit={handleCreateTax}>
          <Input
            label="Tax Rule Name"
            value={taxFormData.name}
            onChange={(e) => setTaxFormData({ ...taxFormData, name: e.target.value })}
            placeholder="e.g. GST (Goods & Services Tax)"
            required
          />
          <Input
            label="Rate Percentage (%)"
            type="number"
            value={taxFormData.rate_percent}
            onChange={(e) => setTaxFormData({ ...taxFormData, rate_percent: e.target.value })}
            placeholder="18"
            required
          />
        </form>
      </Modal>

      {/* User Modal */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title="Create Team Member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUserModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateUser}>Create Account</Button>
          </>
        }
      >
        <form onSubmit={handleCreateUser}>
          <Input
            label="Full Name"
            value={userFormData.full_name}
            onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
            placeholder="e.g. Priya Patel"
            required
          />
          <Input
            label="Email"
            type="email"
            value={userFormData.email}
            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
            placeholder="priya@revora.io"
            required
          />
          <Input
            label="Initial Password"
            type="password"
            value={userFormData.password}
            onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
            placeholder="••••••••"
            required
          />
          <Select
            label="Role"
            value={userFormData.role}
            onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
            options={[
              { value: 'STAFF', label: 'Staff (Billing & Quotation Operations)' },
              { value: 'ADMIN', label: 'Admin (Full System Control)' },
            ]}
          />
        </form>
      </Modal>
    </div>
  );
};

export default SettingsView;
