/**
 * Main App Component
 * Orchestrates the full-stack template application
 */

import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { UserList } from './components/UserList';
import { UserForm } from './components/UserForm';
import { useUsers } from './hooks/useUsers';
import { User, CreateUserRequest } from './api';

type View = 'dashboard' | 'users' | 'create';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { users, loading, error, createUser, updateUser, deleteUser } = useUsers();

  const handleCreateUser = async (data: CreateUserRequest) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          username: data.username,
          email: data.email,
        });
        setEditingUser(null);
      } else {
        await createUser(data);
      }
      setCurrentView('users');
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setCurrentView('create');
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUser(id);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setCurrentView('users');
  };

  const renderNavigation = () => (
    <nav style={styles.nav}>
      <div style={styles.navBrand}>
        <h1 style={styles.brandTitle}>Elide Full-Stack Template</h1>
        <span style={styles.brandSubtitle}>
          React + TypeScript + Vite
        </span>
      </div>
      <div style={styles.navLinks}>
        <button
          style={{
            ...styles.navLink,
            ...(currentView === 'dashboard' ? styles.navLinkActive : {}),
          }}
          onClick={() => {
            setCurrentView('dashboard');
            setEditingUser(null);
          }}
        >
          Dashboard
        </button>
        <button
          style={{
            ...styles.navLink,
            ...(currentView === 'users' ? styles.navLinkActive : {}),
          }}
          onClick={() => {
            setCurrentView('users');
            setEditingUser(null);
          }}
        >
          Users
        </button>
        <button
          style={{
            ...styles.navLink,
            ...(currentView === 'create' ? styles.navLinkActive : {}),
          }}
          onClick={() => {
            setEditingUser(null);
            setCurrentView('create');
          }}
        >
          Create User
        </button>
      </div>
    </nav>
  );

  const renderContent = () => {
    if (error && !loading) {
      return (
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>⚠️</div>
          <h2 style={styles.errorTitle}>Error</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button
            style={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard userCount={users.length} />;
      case 'users':
        return (
          <div style={styles.viewContainer}>
            <div style={styles.viewHeader}>
              <h2 style={styles.viewTitle}>User Management</h2>
              <button
                style={styles.createButton}
                onClick={() => setCurrentView('create')}
              >
                + Create New User
              </button>
            </div>
            <UserList
              users={users}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              loading={loading}
            />
          </div>
        );
      case 'create':
        return (
          <div style={styles.viewContainer}>
            <UserForm
              user={editingUser}
              onSubmit={handleCreateUser}
              onCancel={handleCancelEdit}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.app}>
      {renderNavigation()}
      <main style={styles.main}>{renderContent()}</main>
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Built with Elide • React • TypeScript • Vite
        </p>
        <p style={styles.footerSubtext}>
          A modern full-stack template for polyglot development
        </p>
      </footer>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '16px 32px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  navBrand: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#667eea',
    margin: 0,
  },
  brandSubtitle: {
    fontSize: '12px',
    color: '#666',
    marginTop: '2px',
  },
  navLinks: {
    display: 'flex',
    gap: '8px',
  },
  navLink: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    transition: 'all 0.2s',
  },
  navLinkActive: {
    backgroundColor: '#667eea',
    color: 'white',
  },
  main: {
    flex: 1,
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  viewContainer: {
    width: '100%',
  },
  viewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  viewTitle: {
    color: 'white',
    fontSize: '28px',
    fontWeight: '600',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  createButton: {
    padding: '10px 20px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  errorContainer: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 auto',
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#f44336',
    marginBottom: '12px',
  },
  errorMessage: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px',
  },
  retryButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  footer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '20px 32px',
    textAlign: 'center',
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  footerText: {
    margin: 0,
    fontSize: '14px',
    color: '#667eea',
    fontWeight: '600',
  },
  footerSubtext: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: '#666',
  },
};

export default App;
