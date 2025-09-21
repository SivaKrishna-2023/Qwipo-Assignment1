import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import './CustomerList.css';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ city: '', state: '', pincode: '', q: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  useEffect(() => { fetchList(); }, [page, sortBy, order]);

  async function fetchList() {
    const params = new URLSearchParams({ page, limit, sortBy, order });
    if (filters.city) params.set('city', filters.city);
    if (filters.state) params.set('state', filters.state);
    if (filters.pincode) params.set('pincode', filters.pincode);
    if (filters.q) params.set('q', filters.q);
    const data = await api(`/customers?${params.toString()}`);
    setCustomers(data.customers);
    setTotal(data.total);
  }

  function clear() {
    setFilters({ city: '', state: '', pincode: '', q: '' });
    setPage(1);
    fetchList();
  }

  return (
    <div className="customer-list">
      <div className="toolbar">
        <input className="input" placeholder="Search name/address/email..." value={filters.q} onChange={(e) => setFilters({...filters,q:e.target.value})} />
        <input className="input" placeholder="City" value={filters.city} onChange={(e)=>setFilters({...filters,city:e.target.value})} />
        <input className="input" placeholder="State" value={filters.state} onChange={(e)=>setFilters({...filters,state:e.target.value})} />
        <input className="input" placeholder="Pincode" value={filters.pincode} onChange={(e)=>setFilters({...filters,pincode:e.target.value})} />
        <button className="button primary" onClick={() => { setPage(1); fetchList(); }}>Search</button>
        <button className="button secondary" onClick={clear}>Clear</button>
      </div>

      <div className="list-header">
        <div className="small">Total: {total}</div>
        <div>
          <label className="small">Sort: </label>
          <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)}><option value="created_at">Created</option><option value="first_name">First Name</option></select>
          <select value={order} onChange={(e)=>setOrder(e.target.value)}><option value="desc">Desc</option><option value="asc">Asc</option></select>
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

      <div className="pagination">
        <button disabled={page<=1} onClick={() => setPage(p=>Math.max(1,p-1))} className="button">Prev</button>
        <div>Page {page}</div>
        <button disabled={customers.length < limit} onClick={() => setPage(p=>p+1)} className="button">Next</button>
      </div>
    </div>
  );
}
