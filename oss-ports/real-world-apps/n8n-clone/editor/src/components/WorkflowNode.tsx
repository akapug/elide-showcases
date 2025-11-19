import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap, Database, Mail, Slack, Github, Cloud, FileText, GitBranch } from 'lucide-react';

const nodeIcons: Record<string, React.ReactNode> = {
  manual: <Zap className="w-4 h-4" />,
  webhook: <Zap className="w-4 h-4" />,
  schedule: <Zap className="w-4 h-4" />,
  httpRequest: <Cloud className="w-4 h-4" />,
  postgres: <Database className="w-4 h-4" />,
  mysql: <Database className="w-4 h-4" />,
  mongodb: <Database className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  slack: <Slack className="w-4 h-4" />,
  github: <Github className="w-4 h-4" />,
  set: <FileText className="w-4 h-4" />,
  if: <GitBranch className="w-4 h-4" />,
};

const nodeColors: Record<string, string> = {
  manual: 'bg-gray-500',
  webhook: 'bg-cyan-500',
  schedule: 'bg-blue-500',
  httpRequest: 'bg-blue-600',
  postgres: 'bg-indigo-600',
  mysql: 'bg-blue-700',
  mongodb: 'bg-green-600',
  email: 'bg-blue-500',
  slack: 'bg-purple-600',
  github: 'bg-gray-800',
  set: 'bg-blue-500',
  if: 'bg-green-600',
};

export function WorkflowNode({ data, selected }: NodeProps) {
  const icon = nodeIcons[data.type] || <Zap className="w-4 h-4" />;
  const color = nodeColors[data.type] || 'bg-gray-500';

  return (
    <div
      className={`
        px-4 py-2 rounded-lg border-2 bg-white
        ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'}
        ${data.disabled ? 'opacity-50' : ''}
        min-w-[150px]
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />

      <div className="flex items-center gap-2">
        <div className={`${color} text-white p-1 rounded`}>{icon}</div>
        <div className="flex-1">
          <div className="font-medium text-sm">{data.label}</div>
          <div className="text-xs text-gray-500">{data.type}</div>
        </div>
      </div>

      {data.error && (
        <div className="mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          Error
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}
