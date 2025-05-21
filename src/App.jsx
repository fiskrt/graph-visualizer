// App.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom styling
const nodeStyle = {
  padding: '10px',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'bold',
  fontSize: '16px',
  border: '2px solid #333',
};

// Node color based on algorithm state
const getNodeStyle = (state) => {
  const baseStyle = { ...nodeStyle };
  
  switch (state) {
    case 'current':
      return { ...baseStyle, backgroundColor: '#fbbf24', borderColor: '#92400e' };
    case 'visited':
      return { ...baseStyle, backgroundColor: '#4ade80', borderColor: '#166534' };
    case 'stack':
      return { ...baseStyle, backgroundColor: '#93c5fd', borderColor: '#1e40af' };
    default:
      return { ...baseStyle, backgroundColor: '#d1d5db', borderColor: '#374151' };
  }
};

// Edge color based on algorithm state
const getEdgeStyle = (status) => {
  switch (status) {
    case 'active':
      return { stroke: '#3b82f6', strokeWidth: 3, animated: true };
    case 'visited':
      return { stroke: '#22c55e', strokeWidth: 2 };
    default:
      return { stroke: '#9ca3af', strokeWidth: 1 };
  }
};

// DFS algorithm state management
const useDFS = (initialNodes, initialEdges, startNodeId) => {
  const [visited, setVisited] = useState([]);
  const [stack, setStack] = useState([]);
  const [current, setCurrent] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [speed, setSpeed] = useState(500); // ms between steps
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const timeoutRef = useRef(null);
  
  // Get neighbors of a node
  const getNeighbors = useCallback((nodeId) => {
    return edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);
  }, [edges]);

  // Update node and edge styles based on algorithm state
  const updateStylesForStep = useCallback(() => {
    setNodes(prevNodes => 
      prevNodes.map(node => {
        let state = 'unvisited';
        if (node.id === current) {
          state = 'current';
        } else if (visited.includes(node.id)) {
          state = 'visited';
        } else if (stack.includes(node.id)) {
          state = 'stack';
        }
        
        return {
          ...node,
          style: getNodeStyle(state),
          data: {
            ...node.data,
            state,
          },
        };
      })
    );

    setEdges(prevEdges =>
      prevEdges.map(edge => {
        let status = 'default';
        if (visited.includes(edge.source) && visited.includes(edge.target)) {
          status = 'visited';
        } else if ((current === edge.source && stack.includes(edge.target)) || 
                  (current === edge.target && stack.includes(edge.source))) {
          status = 'active';
        }

        return {
          ...edge,
          animated: status === 'active',
          style: getEdgeStyle(status),
          data: {
            ...edge.data,
            status,
          },
        };
      })
    );
  }, [current, stack, visited]);

  // Reset algorithm state
  const reset = useCallback(() => {
    setVisited([]);
    setStack([]);
    setCurrent(null);
    setIsRunning(false);
    setIsDone(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setNodes(initialNodes.map(node => ({
      ...node,
      style: getNodeStyle('unvisited'),
      data: { ...node.data, state: 'unvisited' },
    })));
    
    setEdges(initialEdges.map(edge => ({
      ...edge,
      animated: false,
      style: getEdgeStyle('default'),
      data: { ...edge.data, status: 'default' },
    })));
  }, [initialNodes, initialEdges]);

  // Initialize DFS
  const startDFS = useCallback(() => {
    reset();
    setStack([startNodeId]);
    setIsRunning(true);
  }, [reset, startNodeId]);

  // Perform a single DFS step
  const step = useCallback(() => {
    if (isDone || stack.length === 0) {
      setIsDone(true);
      setIsRunning(false);
      return;
    }

    const node = stack[stack.length - 1];
    setCurrent(node);

    if (!visited.includes(node)) {
      setVisited(prev => [...prev, node]);
      
      // Get unvisited neighbors
      const neighbors = getNeighbors(node)
        .filter(neighbor => !visited.includes(neighbor))
        .reverse(); // Reverse to maintain correct DFS order when pushing to stack
      
      if (neighbors.length === 0) {
        // Backtrack if no unvisited neighbors
        setStack(prev => prev.slice(0, -1));
      } else {
        // Add neighbors to stack
        setStack(prev => [...prev.slice(0, -1), node, ...neighbors]);
      }
    } else {
      // Node already visited, pop from stack
      setStack(prev => prev.slice(0, -1));
    }
  }, [getNeighbors, isDone, stack, visited]);

  // Auto-run DFS with the set speed
  useEffect(() => {
    if (isRunning && !isDone) {
      timeoutRef.current = setTimeout(step, speed);
      return () => clearTimeout(timeoutRef.current);
    }
  }, [isRunning, isDone, step, speed, stack]);

  // Update visual styles whenever state changes
  useEffect(() => {
    updateStylesForStep();
  }, [updateStylesForStep, visited, current, stack]);

  return {
    visited,
    current,
    stack,
    isRunning,
    isDone,
    speed,
    setSpeed,
    startDFS,
    step,
    reset,
    setIsRunning,
    nodes,
    edges,
  };
};

// Control Panel component
const ControlPanel = ({ 
  isRunning, 
  isDone, 
  onStart, 
  onStep, 
  onReset, 
  onPause,
  speed,
  onSpeedChange 
}) => {
  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    margin: '0 8px',
    fontWeight: 'bold',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {!isRunning ? (
        <button
          onClick={onStart}
          style={{ ...buttonStyle, backgroundColor: '#3b82f6' }}
        >
          {isDone ? 'Restart' : 'Start'}
        </button>
      ) : (
        <button
          onClick={onPause}
          style={{ ...buttonStyle, backgroundColor: '#f59e0b' }}
        >
          Pause
        </button>
      )}
      
      <button
        onClick={onStep}
        disabled={isRunning || isDone}
        style={{ 
          ...buttonStyle, 
          backgroundColor: '#10b981',
          opacity: (isRunning || isDone) ? 0.5 : 1,
          cursor: (isRunning || isDone) ? 'not-allowed' : 'pointer'
        }}
      >
        Step
      </button>
      
      <button
        onClick={onReset}
        style={{ ...buttonStyle, backgroundColor: '#ef4444' }}
      >
        Reset
      </button>
      
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: '16px' }}>
        <span style={{ marginRight: '8px' }}>Speed:</span>
        <input
          type="range"
          min="100"
          max="1000"
          step="100"
          value={speed}
          onChange={e => onSpeedChange(Number(e.target.value))}
          style={{ width: '120px' }}
        />
        <span style={{ marginLeft: '8px' }}>{speed}ms</span>
      </div>
    </div>
  );
};

// Legend component
const Legend = () => {
  const items = [
    { color: '#fbbf24', label: 'Current Node' },
    { color: '#4ade80', label: 'Visited Node' },
    { color: '#93c5fd', label: 'Node in Stack' },
    { color: '#d1d5db', label: 'Unvisited Node' },
  ];
  
  return (
    <div style={{ 
      background: 'white', 
      padding: '12px', 
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Legend</div>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            borderRadius: '50%', 
            backgroundColor: item.color,
            marginRight: '8px'
          }}></div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// Info Panel component
const InfoPanel = ({ visited, stack, current }) => {
  return (
    <div style={{ 
      background: 'white', 
      padding: '12px', 
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      marginTop: '12px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Algorithm State</div>
      <div style={{ marginBottom: '4px' }}>
        <span style={{ fontWeight: 'bold' }}>Current Node:</span> {current || 'None'}
      </div>
      <div style={{ marginBottom: '4px' }}>
        <span style={{ fontWeight: 'bold' }}>Stack:</span> [{stack.join(', ')}]
      </div>
      <div>
        <span style={{ fontWeight: 'bold' }}>Visited:</span> [{visited.join(', ')}]
      </div>
    </div>
  );
};

// Main component
function App() {
  // Create initial nodes and edges for the graph
  const createInitialElements = () => {
    const initialNodes = [
      { id: 'A', position: { x: 250, y: 50 }, data: { label: 'A' }, style: getNodeStyle('unvisited') },
      { id: 'B', position: { x: 150, y: 150 }, data: { label: 'B' }, style: getNodeStyle('unvisited') },
      { id: 'C', position: { x: 350, y: 150 }, data: { label: 'C' }, style: getNodeStyle('unvisited') },
      { id: 'D', position: { x: 100, y: 250 }, data: { label: 'D' }, style: getNodeStyle('unvisited') },
      { id: 'E', position: { x: 200, y: 250 }, data: { label: 'E' }, style: getNodeStyle('unvisited') },
      { id: 'F', position: { x: 400, y: 250 }, data: { label: 'F' }, style: getNodeStyle('unvisited') },
    ];

    const initialEdges = [
      { id: 'A-B', source: 'A', target: 'B', style: getEdgeStyle('default') },
      { id: 'A-C', source: 'A', target: 'C', style: getEdgeStyle('default') },
      { id: 'B-D', source: 'B', target: 'D', style: getEdgeStyle('default') },
      { id: 'B-E', source: 'B', target: 'E', style: getEdgeStyle('default') },
      { id: 'C-E', source: 'C', target: 'E', style: getEdgeStyle('default') },
      { id: 'C-F', source: 'C', target: 'F', style: getEdgeStyle('default') },
    ];

    return { initialNodes, initialEdges };
  };

  const { initialNodes, initialEdges } = createInitialElements();
  const [startNode, setStartNode] = useState('A');
  
  const {
    visited,
    current,
    stack,
    isRunning,
    isDone,
    speed,
    setSpeed,
    startDFS,
    step,
    reset,
    setIsRunning,
    nodes,
    edges,
  } = useDFS(initialNodes, initialEdges, startNode);

  const handleNodeClick = (event, node) => {
    if (!isRunning && !isDone) {
      setStartNode(node.id);
      reset();
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 'bold' }}>
          Graph DFS Visualization
        </h1>
        <ControlPanel
          isRunning={isRunning}
          isDone={isDone}
          onStart={startDFS}
          onStep={step}
          onReset={reset}
          onPause={() => setIsRunning(false)}
          speed={speed}
          onSpeedChange={setSpeed}
        />
      </div>
      
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ flex: 3, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={handleNodeClick}
            fitView
            proOptions={{
              hideAttribution: true,
            }}
          >
            <Background />
            <Controls />
            <Panel position="bottom-left">
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                Click on a node to set it as the starting point
              </div>
            </Panel>
          </ReactFlow>
        </div>
        
        <div style={{ flex: 1, padding: '16px', borderLeft: '1px solid #e5e7eb', overflowY: 'auto' }}>
          <Legend />
          <InfoPanel 
            visited={visited}
            stack={stack}
            current={current}
          />
        </div>
      </div>
    </div>
  );
}

export default App;