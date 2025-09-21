import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import './CustomerForm.css';

export default function CustomerForm() {
  const { id } = useParams();
  const editMode = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name:'', last_name:'', phone:'', email:'', account_type:'' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (editMode) load();
  }, [id]);

  async function load() {
    try {
      const res = await api(`/customers/${id}`);
      setForm({
        first_name: res.customer.first_name,
        last_name: res.customer.last_name,
        phone: res.customer.phone,
        email: res.customer.email || '',
        account_type: res.customer.account_type || ''
      });
    } catch (e) {
      console.error(e);
      alert('Failed to load');
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (form.first_name.trim().length === 0 || form.last_name.trim().length === 0) {
      setMessage('First and last name required');
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setMessage('Phone must be 10 digits');
      return;
    }
    try {
      if (editMode) {
        await api(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(form) });
        setMessage('Updated successfully');
        setTimeout(()=>navigate(`/customer/${id}`), 600);
      } else {
        const res = await api(`/customers`, { method: 'POST', body: JSON.stringify(form) });
        setMessage('Created successfully');
        setTimeout(()=>navigate(`/customer/${res.customer.id}`), 800);
      }
    } catch (err) {
      setMessage(err.body?.message || 'Error saving');
    }
  }

  return (
    <div className="form-card">
      <h2>{editMode ? 'Edit Customer' : 'Add Customer'}</h2>
      <form onSubmit={submit} className="customer-form">
        <label>First Name</label>
        <input className="input" value={form.first_name} onChange={(e)=>setForm({...form, first_name:e.target.value})} />

        <label>Last Name</label>
        <input className="input" value={form.last_name} onChange={(e)=>setForm({...form, last_name:e.target.value})} />

        <label>Phone</label>
        <input className="input" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />

        <label>Email</label>
        <input className="input" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} />

        <label>Account Type</label>
        <select className="input" value={form.account_type} onChange={(e)=>setForm({...form, account_type:e.target.value})}>
          <option value="">Select</option>
          <option value="regular">Regular</option>
          <option value="premium">Premium</option>
        </select>

        <div className="form-actions">
          <button className="button primary" type="submit">{editMode ? 'Save' : 'Create'}</button>
          <button type="button" className="button secondary" onClick={()=>navigate('/') }>Cancel</button>
        </div>
      </form>
      {message && <div className="message">{message}</div>}
    </div>
  );
}
