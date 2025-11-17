import React, { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, Clock, Play } from 'lucide-react';
import { api } from '../api';

interface ExecutionPanelProps {
  workflowId: string | null;
}

export function ExecutionPanel({ workflowId }: ExecutionPanelProps) {
  const [executions, setExecutions] = useState<any[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<any>(null);

  useEffect(() => {
    loadExecutions();
    const interval = setInterval(loadExecutions, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [workflowId]);

  const loadExecutions = async () => {
    try {
      const params = workflowId ? `?workflowId=${workflowId}` : '';
      const response = await api.get(`/executions${params}`);
      setExecutions(response.data.data);
    } catch (error) {
      console.error('Failed to load executions:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'RUNNING':
        return <Play className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDuration = (start: string, stop: string | null) => {
    if (!stop) return 'Running...';
    const duration = new Date(stop).getTime() - new Date(start).getTime();
    return `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold">Executions</h2>
        <p className="text-xs text-gray-500 mt-1">
          {workflowId ? 'Current workflow' : 'All workflows'}
        </p>
      </div>

      {/* Execution list */}
      <div className="flex-1 overflow-y-auto">
        {executions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No executions yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {executions.map((execution) => (
              <button
                key={execution.id}
                onClick={() => setSelectedExecution(execution)}
                className="w-full p-4 hover:bg-gray-50 text-left"
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(execution.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {execution.mode}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDuration(execution.startedAt, execution.stoppedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {new Date(execution.startedAt).toLocaleString()}
                    </p>
                    {execution.error && (
                      <p className="text-xs text-red-600 mt-1 truncate">
                        {execution.error}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Execution details */}
      {selectedExecution && (
        <div className="absolute inset-0 bg-white z-10 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold">Execution Details</h3>
            <button
              onClick={() => setSelectedExecution(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Status
              </label>
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedExecution.status)}
                <span className="font-medium">{selectedExecution.status}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Execution ID
              </label>
              <p className="text-sm font-mono">{selectedExecution.id}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Started
              </label>
              <p className="text-sm">
                {new Date(selectedExecution.startedAt).toLocaleString()}
              </p>
            </div>

            {selectedExecution.stoppedAt && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Duration
                </label>
                <p className="text-sm">
                  {formatDuration(
                    selectedExecution.startedAt,
                    selectedExecution.stoppedAt
                  )}
                </p>
              </div>
            )}

            {selectedExecution.error && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Error
                </label>
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {selectedExecution.error}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Results
              </label>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                {JSON.stringify(selectedExecution.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
