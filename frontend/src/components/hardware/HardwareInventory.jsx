import React, { useEffect, useState } from 'react';
import strengthService from '../../services/api';
import './Hardware.css';

const HardwareInventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    totalCount: 1,
    issuedCount: 0,
    remarks: ''
  });
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await strengthService.hardwareList();
      setItems(res.data?.data || []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const calculateAvailable = (total, issued) => {
    const totalNum = Number(total) || 0;
    const issuedNum = Number(issued) || 0;
    return Math.max(0, totalNum - issuedNum);
  };

const onChange = (e) => {
  const { name, value } = e.target;
  const updatedForm = {
    ...form,
    [name]: name.includes('Count') ? Math.max(0, parseInt(value) || 0) : value
  };

  // Ensure issuedCount doesn't exceed totalCount
  if (name === 'issuedCount' || name === 'totalCount') {
    const total = name === 'totalCount' ? parseInt(value) || 0 : form.totalCount;
    const issued = name === 'issuedCount' ? parseInt(value) || 0 : form.issuedCount;
    
    if (issued > total) {
      updatedForm.issuedCount = total;
    }
  }

  setForm(updatedForm);
};

  const resetForm = () => {
    setForm({
      name: '',
      totalCount: 1,
      issuedCount: 0,
      remarks: ''
    });
    setEditingId(null);
  };

  const onEdit = (item) => {
  setEditingId(item._id);
  setForm({
    name: item.name || '',
    totalCount: item.totalCount || 1,
    issuedCount: item.issuedCount || 0,
    remarks: item.remarks || ''
  });
};

  const onDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await strengthService.hardwareDelete(id);
        await load();
      } catch (e) {
        console.error('Failed to delete hardware', e);
      }
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        name: form.name,
        totalCount: Number(form.totalCount),
        issuedCount: Number(form.issuedCount) || 0,
        availableCount: calculateAvailable(form.totalCount, form.issuedCount),
        remarks: form.remarks
      };

      if (editingId) {
        await strengthService.hardwareUpdate(editingId, formData);
      } else {
        await strengthService.hardwareCreate(formData);
      }

      resetForm();
      await load();
    } catch (e) {
      console.error('Error saving hardware', e);
    }
  };

  return (
    <div className="hardware-inventory">
      <h2>Hardware Inventory</h2>

      <form onSubmit={onSubmit} className="hardware-form">
        <div>
          <label>Name</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label>Total Count</label>
          <input
            type="number"
            name="totalCount"
            value={form.totalCount}
            onChange={onChange}
            min="1"
            required
          />
        </div>
        <div>
          <label>Available Count</label>
          <input
            type="number"
            name="availableCount"
            value={calculateAvailable(form.totalCount, form.issuedCount)}
            readOnly
            className="readonly-input"
          />
        </div>
        <div>
          <label>Issued</label>
          <input
            type="number"
            name="issuedCount"
            value={form.issuedCount}
            onChange={onChange}
            min="0"
            max={form.totalCount}
            required
          />
        </div>
        <div>
          <label>Remarks</label>
          <input
            name="remarks"
            value={form.remarks}
            onChange={onChange}
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Update' : 'Add'} Hardware
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="hardware-list">
        <h3>Hardware List</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Total</th>
                <th>Available</th>
                <th>Issued</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const availableCount = calculateAvailable(item.totalCount, item.issuedCount || 0);
                return (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.totalCount || 0}</td>
                    <td>{availableCount}</td>
                    <td>{item.issuedCount || 0}</td>
                    <td>{item.remarks || '-'}</td>
                    <td>
                      <button
                        onClick={() => onEdit(item)}
                        className="btn btn-sm btn-edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(item._id)}
                        className="btn btn-sm btn-delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .hardware-inventory {
          padding: 20px;
        }
        .hardware-form {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .hardware-form > div {
          margin-bottom: 15px;
        }
        .hardware-form label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        .hardware-form input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .readonly-input {
          background-color: #f0f0f0;
          cursor: not-allowed;
        }
        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-primary {
          background-color: #007bff;
          color: white;
        }
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        .btn-sm {
          padding: 4px 8px;
          font-size: 0.875rem;
        }
        .btn-edit {
          background-color: #ffc107;
          color: #000;
          margin-right: 5px;
        }
        .btn-delete {
          background-color: #dc3545;
          color: white;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background-color: #f8f9fa;
        }
        tr:nth-child(even) {
          background-color: #f2f2f2;
        }
      `}</style>
    </div>
  );
};

export default HardwareInventory;