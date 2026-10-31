import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import productApi from '../../api/products';
import { Plus, Package, Layers, Sparkles } from 'lucide-react';

export const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Create Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    product_type: 'SERVICE',
    sales_price: '',
    cost_price: '',
    notes: '',
    variant_level: 'Intermediate',
    variant_price_extra: '1000',
    variant_sku: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productApi.list({ search: searchTerm });
      setProducts(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch products from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await productApi.create({
        name: formData.name,
        product_type: formData.product_type,
        sales_price: parseFloat(formData.sales_price) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        notes: formData.notes,
        variants: [
          {
            attribute_name: 'Level',
            attribute_value: formData.variant_level,
            price_extra: parseFloat(formData.variant_price_extra) || 0,
            sku: formData.variant_sku || `SKU-${Date.now().toString().slice(-4)}`,
          },
        ],
      });
      setIsModalOpen(false);
      setFormData({
        name: '',
        product_type: 'SERVICE',
        sales_price: '',
        cost_price: '',
        notes: '',
        variant_level: 'Intermediate',
        variant_price_extra: '1000',
        variant_sku: '',
      });
      fetchProducts();
    } catch (err) {
      alert(`Creation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to load standard Python Course template
  const handleLoadPythonCourseTemplate = () => {
    setFormData({
      name: 'Python Programming & Engineering Masterclass',
      product_type: 'SERVICE',
      sales_price: '999',
      cost_price: '250',
      notes: 'Flagship curriculum covering Basic to Advanced Python architectures',
      variant_level: 'Intermediate',
      variant_price_extra: '1000',
      variant_sku: 'REV-PY-INTER',
    });
  };

  const columns = [
    {
      header: 'Product / Course Name',
      key: 'name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{row.name}</div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.notes || 'Service Item'}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'product_type',
      render: (row) => <span className="badge badge-neutral">{row.product_type || 'SERVICE'}</span>,
    },
    {
      header: 'Course Level / Variants',
      key: 'variants',
      render: (row) => {
        const variants = row.variants || [];
        if (variants.length === 0) return <span style={{ color: 'var(--text-muted)' }}>Standard (No variants)</span>;
        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {variants.map((v, i) => (
              <span key={i} className="badge badge-info" title={`Extra: ${formatCurrency(v.price_extra)} (SKU: ${v.sku})`}>
                {v.attribute_value || v.name} (+{formatCurrency(v.price_extra || 0)})
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Base Sales Price',
      key: 'sales_price',
      align: 'right',
      render: (row) => <span className="currency-inr font-medium">{formatCurrency(row.sales_price)}</span>,
    },
    {
      header: 'Status',
      key: 'is_active',
      render: (row) => <StatusBadge status={row.is_active !== false ? 'ACTIVE' : 'CLOSED'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products & Course Catalogs"
        subtitle="Manage subscription items, course variants, and pricing surcharges"
        breadcrumbs={['Home', 'Products']}
        actions={
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Add Product / Course
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        error={error}
        onRetry={fetchProducts}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search products by title or SKU..."
        emptyTitle="No products found in catalog"
        emptyDescription="Create your first Python course offering or software product."
        emptyActionLabel="Add Python Course"
        onEmptyAction={() => {
          handleLoadPythonCourseTemplate();
          setIsModalOpen(true);
        }}
      />

      {/* Create Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Product / Python Course"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateProduct} loading={submitting}>
              Save to Catalog
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateProduct}>
          <div style={{ marginBottom: 'var(--space-3)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleLoadPythonCourseTemplate}
              style={{
                fontSize: '11px',
                color: 'var(--primary)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={12} /> Auto-fill Python Masterclass
            </button>
          </div>

          <Input
            label="Product Title"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Python Programming Masterclass"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Select
              label="Product Type"
              value={formData.product_type}
              onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
              options={[
                { value: 'SERVICE', label: 'Service / Course' },
                { value: 'SOFTWARE', label: 'Cloud Software' },
                { value: 'HARDWARE', label: 'Hardware' },
              ]}
              required
            />
            <Input
              label="Base Sales Price (₹)"
              type="number"
              value={formData.sales_price}
              onChange={(e) => setFormData({ ...formData, sales_price: e.target.value })}
              placeholder="999.00"
              required
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
            <span className="form-label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
              Primary Course Level / Variant
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Select
                label="Level"
                value={formData.variant_level}
                onChange={(e) => setFormData({ ...formData, variant_level: e.target.value })}
                options={[
                  { value: 'Basic', label: 'Basic Level (+₹0.00)' },
                  { value: 'Intermediate', label: 'Intermediate Level (+₹1,000.00)' },
                  { value: 'Advanced', label: 'Advanced Level (+₹2,500.00)' },
                ]}
              />
              <Input
                label="Price Extra (₹)"
                type="number"
                value={formData.variant_price_extra}
                onChange={(e) => setFormData({ ...formData, variant_price_extra: e.target.value })}
                placeholder="1000"
              />
            </div>
            <Input
              label="Variant SKU"
              value={formData.variant_sku}
              onChange={(e) => setFormData({ ...formData, variant_sku: e.target.value })}
              placeholder="e.g. REV-PY-INTER"
            />
          </div>

          <Input
            label="Curriculum Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Detailed course description, prerequisites, and syllabus notes"
          />
        </form>
      </Modal>
    </div>
  );
};

export default ProductList;

