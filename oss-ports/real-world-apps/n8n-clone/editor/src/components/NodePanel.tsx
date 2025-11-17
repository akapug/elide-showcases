import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { api } from '../api';

interface NodePanelProps {
  onSelectNode: (nodeType: string) => void;
  onClose: () => void;
}

export function NodePanel({ onSelectNode, onClose }: NodePanelProps) {
  const [nodeTypes, setNodeTypes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  useEffect(() => {
    loadNodeTypes();
  }, []);

  const loadNodeTypes = async () => {
    try {
      const response = await api.get('/nodes');
      setNodeTypes(response.data.data);
    } catch (error) {
      console.error('Failed to load node types:', error);
    }
  };

  const filteredNodes = nodeTypes.filter((node) => {
    const matchesSearch =
      node.displayName.toLowerCase().includes(search.toLowerCase()) ||
      node.description.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || node.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const groups = ['all', ...new Set(nodeTypes.map((node) => node.group))];

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-3/4 max-w-4xl h-3/4 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold">Add Node</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Groups */}
        <div className="p-4 border-b border-gray-200 flex gap-2 overflow-x-auto">
          {groups.map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                ${
                  selectedGroup === group
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {group.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Node list */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNodes.map((node) => (
              <button
                key={node.name}
                onClick={() => onSelectNode(node.name)}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg text-left transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: node.defaults.color }}
                  >
                    {node.displayName[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{node.displayName}</h3>
                    <p className="text-xs text-gray-600 mt-1">{node.description}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs rounded">
                      {node.group}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
