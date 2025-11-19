import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowNode as WorkflowNodeComponent } from './WorkflowNode';
import { NodePanel } from './NodePanel';
import { NodeSettings } from './NodeSettings';
import { api } from '../api';
import { Play, Save, Settings, Zap } from 'lucide-react';

interface WorkflowEditorProps {
  workflowId: string;
  onClose: () => void;
}

const nodeTypes = {
  workflowNode: WorkflowNodeComponent,
};

export function WorkflowEditor({ workflowId, onClose }: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflow, setWorkflow] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodePanel, setShowNodePanel] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Load workflow
  useEffect(() => {
    loadWorkflow();
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      const response = await api.get(`/workflows/${workflowId}`);
      const wf = response.data.data;
      setWorkflow(wf);

      // Convert workflow nodes to React Flow nodes
      const flowNodes: Node[] = wf.nodes.map((node: any) => ({
        id: node.id,
        type: 'workflowNode',
        position: { x: node.position.x, y: node.position.y },
        data: {
          label: node.name,
          type: node.type,
          disabled: node.disabled,
          parameters: node.parameters,
        },
      }));

      // Convert connections to edges
      const flowEdges: Edge[] = [];
      Object.entries(wf.connections).forEach(([sourceId, outputs]: [string, any]) => {
        Object.entries(outputs).forEach(([outputName, connections]: [string, any]) => {
          connections.forEach((conn: any, index: number) => {
            flowEdges.push({
              id: `${sourceId}-${conn.node}-${index}`,
              source: sourceId,
              target: conn.node,
              sourceHandle: outputName,
              targetHandle: conn.type,
            });
          });
        });
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleAddNode = (nodeType: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'workflowNode',
      position: { x: 250, y: 250 },
      data: {
        label: nodeType,
        type: nodeType,
        disabled: false,
        parameters: {},
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setShowNodePanel(false);
  };

  const handleSave = async () => {
    try {
      // Convert React Flow nodes back to workflow format
      const workflowNodes = nodes.map((node) => ({
        id: node.id,
        name: node.data.label,
        type: node.data.type,
        position: { x: node.position.x, y: node.position.y },
        parameters: node.data.parameters || {},
        disabled: node.data.disabled || false,
      }));

      // Convert edges to connections
      const connections: any = {};
      edges.forEach((edge) => {
        if (!connections[edge.source]) {
          connections[edge.source] = {};
        }
        if (!connections[edge.source][edge.sourceHandle || 'main']) {
          connections[edge.source][edge.sourceHandle || 'main'] = [];
        }
        connections[edge.source][edge.sourceHandle || 'main'].push({
          node: edge.target,
          type: edge.targetHandle || 'main',
          index: 0,
        });
      });

      await api.put(`/workflows/${workflowId}`, {
        nodes: workflowNodes,
        connections,
      });

      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const response = await api.post('/executions', {
        workflowId,
        mode: 'MANUAL',
      });

      const execution = response.data.data;
      alert(`Workflow executed!\nStatus: ${execution.status}\nExecution ID: ${execution.id}`);
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      alert('Failed to execute workflow');
    } finally {
      setExecuting(false);
    }
  };

  const handleActivate = async () => {
    try {
      await api.post(`/workflows/${workflowId}/activate`);
      alert('Workflow activated!');
      loadWorkflow();
    } catch (error) {
      console.error('Failed to activate workflow:', error);
      alert('Failed to activate workflow');
    }
  };

  return (
    <div className="h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />

        <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-2 m-4">
          <div className="flex gap-2">
            <button
              onClick={() => setShowNodePanel(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Add Node
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleExecute}
              disabled={executing}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {executing ? 'Executing...' : 'Execute'}
            </button>
            <button
              onClick={handleActivate}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {workflow?.active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </Panel>

        <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4 m-4">
          <div className="text-sm">
            <h3 className="font-bold text-lg mb-2">{workflow?.name}</h3>
            <p className="text-gray-600">{workflow?.description}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded text-xs ${
                  workflow?.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {workflow?.active ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs text-gray-500">{nodes.length} nodes</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Node panel */}
      {showNodePanel && (
        <NodePanel onSelectNode={handleAddNode} onClose={() => setShowNodePanel(false)} />
      )}

      {/* Node settings */}
      {selectedNode && (
        <NodeSettings
          node={selectedNode}
          onUpdate={(updatedNode) => {
            setNodes((nds) =>
              nds.map((n) => (n.id === updatedNode.id ? updatedNode : n))
            );
            setSelectedNode(null);
          }}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
