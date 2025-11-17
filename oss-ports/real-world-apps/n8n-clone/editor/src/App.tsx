import React, { useState } from 'react';
import { WorkflowEditor } from './components/WorkflowEditor';
import { WorkflowList } from './components/WorkflowList';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ExecutionPanel } from './components/ExecutionPanel';

export default function App() {
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [showExecutions, setShowExecutions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-64 bg-white border-r border-gray-200">
          <Sidebar onSelectWorkflow={setCurrentWorkflowId} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onShowExecutions={() => setShowExecutions(!showExecutions)}
        />

        {/* Workflow editor or list */}
        <div className="flex-1 overflow-hidden">
          {currentWorkflowId ? (
            <WorkflowEditor
              workflowId={currentWorkflowId}
              onClose={() => setCurrentWorkflowId(null)}
            />
          ) : (
            <WorkflowList onSelectWorkflow={setCurrentWorkflowId} />
          )}
        </div>
      </div>

      {/* Execution panel */}
      {showExecutions && (
        <div className="w-96 bg-white border-l border-gray-200">
          <ExecutionPanel workflowId={currentWorkflowId} />
        </div>
      )}
    </div>
  );
}
