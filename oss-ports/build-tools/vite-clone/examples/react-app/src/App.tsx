/**
 * Vite Clone - React Example App
 */

import React, { useState } from 'react';
import './App.css';
import Counter from './components/Counter';
import TodoList from './components/TodoList';
import UserProfile from './components/UserProfile';

function App() {
  const [activeTab, setActiveTab] = useState('counter');

  return (
    <div className="App">
      <header className="App-header">
        <h1>Vite Clone - React Example</h1>
        <p>Experience lightning-fast HMR with Vite Clone powered by Elide</p>
      </header>

      <nav className="App-nav">
        <button
          className={activeTab === 'counter' ? 'active' : ''}
          onClick={() => setActiveTab('counter')}
        >
          Counter
        </button>
        <button
          className={activeTab === 'todos' ? 'active' : ''}
          onClick={() => setActiveTab('todos')}
        >
          Todo List
        </button>
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
      </nav>

      <main className="App-main">
        {activeTab === 'counter' && <Counter />}
        {activeTab === 'todos' && <TodoList />}
        {activeTab === 'profile' && <UserProfile />}
      </main>

      <footer className="App-footer">
        <p>Built with Vite Clone and Elide</p>
        <p>Edit any component and see instant updates!</p>
      </footer>
    </div>
  );
}

export default App;
