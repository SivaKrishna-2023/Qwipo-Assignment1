import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import AddressList from './AddressList';
import './CustomerProfile.css';

export default function CustomerProfile() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const res = await api(`/customers/${id}`);
      setCustomer(res.customer);
      setAddresses(res.addresses);
    } catch (e) {
      console.error(e);
      alert('Failed to load customer');
    }
  }

  async function removeCustomer() {
    if (!window.confirm('Are you sure you want to delete this customer? This will remove addresses too.')) return;
    await api(`/customers/${id}`, { method: 'DELETE' });
    alert('Deleted');
    navigate('/');
  }

  if (!customer) return <div className="card">Loading...</div>;

  return (
    <div className="profile-card">
      <h2>{customer.first_name} {customer.last_name}</h2>
      <div className="detail">Phone: {customer.phone}</div>
      <div className="detail">Email: {customer.email || '-'}</div>
      <div className="detail">Account: {customer.account_type || '-'}</div>

      <div className="profile-actions">
        <Link to={`/edit/${id}`} className="button primary">Edit</Link>
        <button className="button danger" onClick={removeCustomer}>Delete</button>
      </div>

      <h3 className="section-title">Addresses</h3>
      <AddressList customerId={id} addresses={addresses} onChange={load} />
    </div>
  );
}
