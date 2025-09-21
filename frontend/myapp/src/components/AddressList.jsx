import React, { useState } from 'react';
import { api } from '../api';
import './AddressList.css';

export default function AddressList({ customerId, addresses = [], onChange }) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ line1:'', line2:'', city:'', state:'', pincode:'', is_primary:false });

  function startNew() {
    setEditingId('new');
    setForm({ line1:'', line2:'', city:'', state:'', pincode:'', is_primary:false });
  }

  function startEdit(a) {
    setEditingId(a.id);
    setForm({ line1:a.line1, line2:a.line2 || '', city:a.city, state:a.state, pincode:a.pincode, is_primary:!!a.is_primary });
  }

  async function save() {
    try {
      if (editingId === 'new') {
        await api('/addresses', { method: 'POST', body: JSON.stringify({ customer_id: customerId, ...form }) });
      } else {
        await api(`/addresses/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
      }
      setEditingId(null);
      onChange();
    } catch (err) {
      alert(err.body?.message || 'Error saving address');
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this address?')) return;
    await api(`/addresses/${id}`, { method: 'DELETE' });
    onChange();
  }

  return (
    <div className="address-list">
      <div className="address-actions">
        <button className="button primary" onClick={startNew}>Add Address</button>
      </div>

      {editingId && <div className="card edit-card">
        <h4>{editingId === 'new' ? 'Add Address' : 'Edit Address'}</h4>
        <input className="input" placeholder="Line 1" value={form.line1} onChange={(e)=>setForm({...form,line1:e.target.value})} />
        <input className="input" placeholder="Line 2" value={form.line2} onChange={(e)=>setForm({...form,line2:e.target.value})} />
        <input className="input" placeholder="City" value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})} />
        <input className="input" placeholder="State" value={form.state} onChange={(e)=>setForm({...form,state:e.target.value})} />
        <input className="input" placeholder="Pincode" value={form.pincode} onChange={(e)=>setForm({...form,pincode:e.target.value})} />
        <label className="checkbox">
          <input type="checkbox" checked={form.is_primary} onChange={(e)=>setForm({...form,is_primary:e.target.checked})} /> Primary
        </label>
        <div className="form-actions">
          <button className="button primary" onClick={save}>Save</button>
          <button className="button secondary" onClick={()=>setEditingId(null)}>Cancel</button>
        </div>
      </div>}

      <div className="grid">
        {addresses.map(a => (
          <div key={a.id} className="card">
            <div><strong>{a.line1}</strong> {a.line2}</div>
            <div className="small">{a.city}, {a.state} - {a.pincode}</div>
            <div className="small">Primary: {a.is_primary ? 'Yes' : 'No'}</div>
            <div className="actions">
              <button className="button primary" onClick={()=>startEdit(a)}>Edit</button>
              <button className="button danger" onClick={()=>remove(a.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
