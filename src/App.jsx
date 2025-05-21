import React, { useState, useEffect, useCallback, useRef } from 'react';

// Graph data structure
class Graph {
  constructor() {
    this.nodes = [];
    this.edges = [];
  }

  addNode(id, x, y) {
    this.nodes.push({ id, x, y });
    return this;
  }

  addEdge(source, target) {
    this.edges.push({ source, target });
    return this;
  }

  getNeighbors(nodeId) {
    return this.edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);
  }
}

// DFS algorithm state management
const useDFS = (graph, startNodeId) => {
  const [visited, setVisited] = useState([]);
  const [stack, setStack] = useState([]);
  const [current, setCurrent] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [speed, setSpeed] = useState(500); // ms between steps
  const timeoutRef = useRef(null);

  // Reset algorithm state
  const reset = useCallback(() => {
    setVisited([]);
    setStack([]);
    setCurrent(null);
    setIsRunning(false);
    setIsDone(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

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
      const neighbors = graph.getNeighbors(node)
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
  }, [graph, isDone, stack, visited]);

  // Auto-run DFS with the set speed
  useEffect(() => {
    if (isRunning && !isDone) {
      timeoutRef.current = setTimeout(step, speed);
      return () => clearTimeout(timeoutRef.current);
    }
  }, [isRunning, isDone, step, speed, stack]);

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
    setIsRunning
  };
};

// Node component
const Node = ({ id, x, y, state, onClick }) => {
  const getNodeColor = () => {
    switch (state) {
      case 'current': return 'fill-yellow-400';
      case 'visited': return 'fill-green-400';
      case 'stack': return 'fill-blue-300';
      default: return 'fill-gray-300';
    }
  };

  return (
    <g onClick={onClick}>
      <circle
        cx={x}
        cy={y}
        r={20}
        className={`${getNodeColor()} stroke-gray-700 stroke-2 transition-colors duration-300`}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-bold text-sm"
      >
        {id}
      </text>
    </g>
  );
};

// Edge component
const Edge = ({ source, target, nodes, status }) => {
  const sourceNode = nodes.find(node => node.id === source);
  const targetNode = nodes.find(node => node.id === target);

  if (!sourceNode || !targetNode) return null;

  const getEdgeColor = () => {
    switch (status) {
      case 'active': return 'stroke-blue-500';
      case 'visited': return 'stroke-green-500';
      default: return 'stroke-gray-400';
    }
  };

  return (
    <line
      x1={sourceNode.x}
      y1={sourceNode.y}
      x2={targetNode.x}
      y2={targetNode.y}
      className={`${getEdgeColor()} stroke-2 transition-colors duration-300`}
    />
  );
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
  return (
    <div className="flex items-center space-x-4 mb-4">
      {!isRunning ? (
        <button
          onClick={onStart}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          {isDone ? 'Restart' : 'Start'}
        </button>
      ) : (
        <button
          onClick={onPause}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
        >
          Pause
        </button>
      )}
      
      <button
        onClick={onStep}
        disabled={isRunning || isDone}
        className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition ${(isRunning || isDone) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Step
      </button>
      
      <button
        onClick={onReset}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Reset
      </button>
      
      <div className="flex items-center">
        <span className="mr-2">Speed:</span>
        <input
          type="range"
          min="100"
          max="1000"
          step="100"
          value={speed}
          onChange={e => onSpeedChange(Number(e.target.value))}
          className="w-32"
        />
        <span className="ml-2">{speed}ms</span>
      </div>
    </div>
  );
};

// Legend component
const Legend = () => {
  return (
    <div className="flex flex-col space-y-2 mb-4">
      <div className="text-xl font-bold">Legend</div>
      <div className="flex items-center">
        <div className="w-6 h-6 rounded-full bg-yellow-400 mr-2"></div>
        <span>Current Node</span>
      </div>
      <div className="flex items-center">
        <div className="w-6 h-6 rounded-full bg-green-400 mr-2"></div>
        <span>Visited Node</span>
      </div>
      <div className="flex items-center">
        <div className="w-6 h-6 rounded-full bg-blue-300 mr-2"></div>
        <span>Node in Stack</span>
      </div>
      <div className="flex items-center">
        <div className="w-6 h-6 rounded-full bg-gray-300 mr-2"></div>
        <span>Unvisited Node</span>
      </div>
    </div>
  );
};

// Info Panel component
const InfoPanel = ({ visited, stack, current }) => {
  return (
    <div className="flex flex-col space-y-2 mb-4">
      <div className="text-xl font-bold">Algorithm State</div>
      <div>
        <span className="font-bold">Current Node:</span> {current || 'None'}
      </div>
      <div>
        <span className="font-bold">Stack:</span> [{stack.join(', ')}]
      </div>
      <div>
        <span className="font-bold">Visited:</span> [{visited.join(', ')}]
      </div>
    </div>
  );
};

// Main component
const App = () => {
  // Create a sample graph
  const createSampleGraph = () => {
    const g = new Graph();
    g.addNode('A', 150, 50)
     .addNode('B', 75, 150)
     .addNode('C', 225, 150)
     .addNode('D', 50, 250)
     .addNode('E', 150, 250)
     .addNode('F', 250, 250)
     .addNode('G', 250, 50);
    
    g.addEdge('A', 'B')
     .addEdge('A', 'C')
     .addEdge('B', 'D')
     .addEdge('B', 'E')
     .addEdge('C', 'E')
     .addEdge('C', 'F');
    
    return g;
  };

  const [graph] = useState(createSampleGraph());
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
    setIsRunning
  } = useDFS(graph, startNode);

  const handleNodeClick = (nodeId) => {
    if (!isRunning && !isDone) {
      setStartNode(nodeId);
    }
  };

  useEffect(() => {
    if (!isRunning && !isDone) {
      reset();
    }
  }, [startNode, reset, isRunning, isDone]);

  const getNodeState = (nodeId) => {
    if (nodeId === current) return 'current';
    if (visited.includes(nodeId)) return 'visited';
    if (stack.includes(nodeId)) return 'stack';
    return 'unvisited';
  };

  const getEdgeStatus = (source, target) => {
    // If both nodes are visited, the edge is visited
    if (visited.includes(source) && visited.includes(target)) {
      return 'visited';
    }
    // If one node is current and the other is in stack or visited, the edge is active
    if ((current === source && stack.includes(target)) || 
        (current === target && stack.includes(source))) {
      return 'active';
    }
    return 'default';
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Graph DFS Visualization</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="border rounded p-4 bg-white shadow">
            <svg width="100%" height="300" viewBox="0 0 300 300">
              {/* Render edges first so they appear behind nodes */}
              {graph.edges.map((edge, index) => (
                <Edge
                  key={`${edge.source}-${edge.target}`}
                  source={edge.source}
                  target={edge.target}
                  nodes={graph.nodes}
                  status={getEdgeStatus(edge.source, edge.target)}
                />
              ))}
              
              {/* Render nodes */}
              {graph.nodes.map(node => (
                <Node
                  key={node.id}
                  id={node.id}
                  x={node.x}
                  y={node.y}
                  state={getNodeState(node.id)}
                  onClick={() => handleNodeClick(node.id)}
                />
              ))}
            </svg>
            
            <div className="text-center mt-2 text-sm text-gray-600">
              Click on a node to set it as the starting point
            </div>
          </div>
          
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
        
        <div className="space-y-4">
          <div className="border rounded p-4 bg-white shadow">
            <Legend />
          </div>
          
          <div className="border rounded p-4 bg-white shadow">
            <InfoPanel 
              visited={visited}
              stack={stack}
              current={current}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;