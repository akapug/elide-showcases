import React, { useState } from 'react';
import { Node } from '@xyflow/react';
import { X, Save } from 'lucide-react';

interface NodeSettingsProps {
  node: Node;
  onUpdate: (node: Node) => void;
  onClose: () => void;
}

export function NodeSettings({ node, onUpdate, onClose }: NodeSettingsProps) {
  const [name, setName] = useState(node.data.label);
  const [disabled, setDisabled] = useState(node.data.disabled || false);
  const [parameters, setParameters] = useState(node.data.parameters || {});

  const handleSave = () => {
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        label: name,
        disabled,
        parameters,
      },
    };
    onUpdate(updatedNode);
  };

  const handleParameterChange = (key: string, value: any) => {
    setParameters((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="absolute inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-bold">Node Settings</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Node type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Type
          </label>
          <input
            type="text"
            value={node.data.type}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        {/* Disabled */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={disabled}
            onChange={(e) => setDisabled(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm text-gray-700">Disable node</label>
        </div>

        {/* Parameters */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Parameters</h3>
          <div className="space-y-3">
            {/* Common parameters based on node type */}
            {node.data.type === 'httpRequest' && (
              <>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Method</label>
                  <select
                    value={parameters.method || 'GET'}
                    onChange={(e) => handleParameterChange('method', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">URL</label>
                  <input
                    type="text"
                    value={parameters.url || ''}
                    onChange={(e) => handleParameterChange('url', e.target.value)}
                    placeholder="https://api.example.com/endpoint"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {node.data.type === 'webhook' && (
              <>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">HTTP Method</label>
                  <select
                    value={parameters.httpMethod || 'POST'}
                    onChange={(e) => handleParameterChange('httpMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Path</label>
                  <input
                    type="text"
                    value={parameters.path || ''}
                    onChange={(e) => handleParameterChange('path', e.target.value)}
                    placeholder="webhook/my-workflow"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {node.data.type === 'schedule' && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Cron Expression</label>
                <input
                  type="text"
                  value={parameters.cronExpression || '0 0 * * *'}
                  onChange={(e) => handleParameterChange('cronExpression', e.target.value)}
                  placeholder="0 0 * * *"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Daily at midnight
                </p>
              </div>
            )}

            {/* Generic JSON editor for other parameters */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Additional Parameters (JSON)
              </label>
              <textarea
                value={JSON.stringify(parameters, null, 2)}
                onChange={(e) => {
                  try {
                    setParameters(JSON.parse(e.target.value));
                  } catch (err) {
                    // Invalid JSON, ignore
                  }
                }}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}
