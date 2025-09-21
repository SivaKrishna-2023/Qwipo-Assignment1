import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import './CustomerList.css';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({ city: '', state: '', pincode: '', q: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  useEffect(() => { fetchList(); }, [sortBy, order, filters]);

  async function fetchList() {
    const params = new URLSearchParams({ sortBy, order });
    if (filters.city) params.set('city', filters.city);
    if (filters.state) params.set('state', filters.state);
    if (filters.pincode) params.set('pincode', filters.pincode);
    if (filters.q) params.set('q', filters.q);

    try {
      const data = await api(`/customers?${params.toString()}`);
      setCustomers(data.customers);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  }

  function clear() {
    setFilters({ city: '', state: '', pincode: '', q: '' });
  }

  return (
    <div className="customer-list">
      <div className="toolbar">
        <input className="input" placeholder="Search name/address/email..." value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <input className="input" placeholder="City" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
        <input className="input" placeholder="State" value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value })} />
        <input className="input" placeholder="Pincode" value={filters.pincode} onChange={(e) => setFilters({ ...filters, pincode: e.target.value })} />
        <button className="button primary" onClick={fetchList}>Search</button>
        <button className="button secondary" onClick={clear}>Clear</button>
      </div>

      <div className="list-header">
        <div className="small">Total: {customers.length}</div>
        <div>
          <label className="small">Sort: </label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="created_at">Created</option>
            <option value="first_name">First Name</option>
          </select>
          <select value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      <div className="grid">
        {customers.map(c => (
          <div key={c.id} className="card">
            <h3>{c.first_name} {c.last_name}</h3>
            <div className="small">Phone: {c.phone}</div>
            <div className="small">Email: {c.email || '-'}</div>
            <div className="small">Only One Address: {c.only_one_address ? 'Yes' : 'No'}</div>
            <div className="actions">
              <Link to={`/customer/${c.id}`} className="button primary">View</Link>
              <Link to={`/edit/${c.id}`} className="button secondary">Edit</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
