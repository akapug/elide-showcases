/**
 * Admin Dashboard - Main Entry Point
 *
 * This is a basic React admin dashboard for the Ghost Clone.
 * In production, you would expand this with full CRUD interfaces,
 * rich text editors, media management, etc.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './style.css';

// Simple admin components (expand these in production)
function Dashboard() {
  return (
    <div className="page">
      <h1>Dashboard</h1>
      <div className="stats">
        <div className="stat-card">
          <h3>Posts</h3>
          <p className="stat-value">12</p>
        </div>
        <div className="stat-card">
          <h3>Pages</h3>
          <p className="stat-value">4</p>
        </div>
        <div className="stat-card">
          <h3>Tags</h3>
          <p className="stat-value">8</p>
        </div>
        <div className="stat-card">
          <h3>Views (30d)</h3>
          <p className="stat-value">1,234</p>
        </div>
      </div>
      <p>Welcome to the Ghost Clone admin dashboard. Use the sidebar to manage your content.</p>
    </div>
  );
}

function Posts() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Posts</h1>
        <button className="button-primary">New Post</button>
      </div>
      <p>Post management interface would go here.</p>
      <p>Features: List, create, edit, delete posts. Rich text editor. Tag management.</p>
    </div>
  );
}

function Pages() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Pages</h1>
        <button className="button-primary">New Page</button>
      </div>
      <p>Page management interface would go here.</p>
    </div>
  );
}

function Tags() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Tags</h1>
        <button className="button-primary">New Tag</button>
      </div>
      <p>Tag management interface would go here.</p>
    </div>
  );
}

function Media() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Media Library</h1>
        <button className="button-primary">Upload</button>
      </div>
      <p>Media management interface would go here.</p>
      <p>Features: Upload images, browse library, delete files.</p>
    </div>
  );
}

function Settings() {
  return (
    <div className="page">
      <h1>Settings</h1>
      <p>Site settings interface would go here.</p>
      <p>Features: Site title, description, social links, navigation, etc.</p>
    </div>
  );
}

function Users() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Users</h1>
        <button className="button-primary">Invite User</button>
      </div>
      <p>User management interface would go here.</p>
    </div>
  );
}

function Analytics() {
  return (
    <div className="page">
      <h1>Analytics</h1>
      <p>Analytics dashboard would go here.</p>
      <p>Features: Charts, graphs, top posts, traffic sources.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/admin">
      <div className="admin-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Ghost Clone</h2>
            <p>Admin</p>
          </div>
          <nav className="sidebar-nav">
            <Link to="/" className="nav-item">📊 Dashboard</Link>
            <Link to="/posts" className="nav-item">📝 Posts</Link>
            <Link to="/pages" className="nav-item">📄 Pages</Link>
            <Link to="/tags" className="nav-item">🏷️ Tags</Link>
            <Link to="/media" className="nav-item">🖼️ Media</Link>
            <Link to="/analytics" className="nav-item">📈 Analytics</Link>
            <Link to="/users" className="nav-item">👥 Users</Link>
            <Link to="/settings" className="nav-item">⚙️ Settings</Link>
          </nav>
          <div className="sidebar-footer">
            <a href="/" className="nav-item">🌐 View Site</a>
            <button className="nav-item">🚪 Logout</button>
          </div>
        </aside>

        <main className="admin-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/pages" element={<Pages />} />
            <Route path="/tags" element={<Tags />} />
            <Route path="/media" element={<Media />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
