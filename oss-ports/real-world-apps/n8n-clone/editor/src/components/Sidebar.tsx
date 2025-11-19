import React from 'react';
import { Workflow, Play, Settings, Key, FileText } from 'lucide-react';

interface SidebarProps {
  onSelectWorkflow: (workflowId: string | null) => void;
}

export function Sidebar({ onSelectWorkflow }: SidebarProps) {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">Elide Workflow</h1>
        <p className="text-xs text-gray-500">Automation Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => onSelectWorkflow(null)}
              className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <Workflow className="w-5 h-5" />
              <span>Workflows</span>
            </button>
          </li>
          <li>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <Play className="w-5 h-5" />
              <span>Executions</span>
            </button>
          </li>
          <li>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <Key className="w-5 h-5" />
              <span>Credentials</span>
            </button>
          </li>
          <li>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <FileText className="w-5 h-5" />
              <span>Documentation</span>
            </button>
          </li>
          <li>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>Version 1.0.0</p>
          <p className="mt-1">Powered by Elide</p>
        </div>
      </div>
    </div>
  );
}
