/**
 * Counter Component - Demonstrates React Fast Refresh
 */

import React, { useState, useEffect } from 'react';
import './Counter.css';

export default function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);
  const [history, setHistory] = useState<number[]>([0]);

  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  const increment = () => {
    const newCount = count + step;
    setCount(newCount);
    setHistory([...history, newCount]);
  };

  const decrement = () => {
    const newCount = count - step;
    setCount(newCount);
    setHistory([...history, newCount]);
  };

  const reset = () => {
    setCount(0);
    setHistory([0]);
  };

  const undo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setCount(newHistory[newHistory.length - 1]);
    }
  };

  return (
    <div className="counter">
      <h2>Counter with Fast Refresh</h2>

      <div className="counter-display">
        <div className="count-value">{count}</div>
      </div>

      <div className="counter-controls">
        <button onClick={decrement} className="btn btn-danger">
          - {step}
        </button>
        <button onClick={increment} className="btn btn-success">
          + {step}
        </button>
      </div>

      <div className="counter-step">
        <label>
          Step:
          <input
            type="number"
            value={step}
            onChange={(e) => setStep(parseInt(e.target.value) || 1)}
            min="1"
          />
        </label>
      </div>

      <div className="counter-actions">
        <button onClick={reset} className="btn btn-secondary">
          Reset
        </button>
        <button
          onClick={undo}
          className="btn btn-secondary"
          disabled={history.length <= 1}
        >
          Undo
        </button>
      </div>

      <div className="counter-history">
        <h3>History</h3>
        <div className="history-list">
          {history.map((value, index) => (
            <span key={index} className="history-item">
              {value}
              {index < history.length - 1 && ' → '}
            </span>
          ))}
        </div>
      </div>

      <div className="counter-info">
        <p>Try editing this component - your state will be preserved!</p>
        <p>Total operations: {history.length - 1}</p>
      </div>
    </div>
  );
}
