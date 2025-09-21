import React from 'react';
import "./App.css"
import { Routes, Route, Link } from 'react-router-dom';
import CustomerList from './components/CustomerList';
import CustomerForm from './components/CustomerForm';
import CustomerProfile from './components/CustomerProfile';

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>Customer Manager</h1>
        <nav>
          <Link to="/">Customers</Link> | <Link to="/new">Add Customer</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<CustomerList />} />
          <Route path="/new" element={<CustomerForm />} />
          <Route path="/edit/:id" element={<CustomerForm />} />
          <Route path="/customer/:id" element={<CustomerProfile />} />
        </Routes>
      </main>
    </div>
  );
}
