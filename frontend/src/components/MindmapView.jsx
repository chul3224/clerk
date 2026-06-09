import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { API_BASE, authHeaders } from '../api/client'

const NODE_COLORS = ['#1d4ed8', '#0891b2', '#059669', '#d97706']
const NODE_WIDTH = 150
const H_GAP = 40
const V_GAP = 90

function subtreeWidth(node) {
  if (!node.children?.length) return NODE_WIDTH + H_GAP
  return node.children.reduce((s, c) => s + subtreeWidth(c), 0)
}

function buildFlow(root) {
  const nodes = []
  const edges = []
  let counter = 0

  function traverse(node, parentId, x, y, level) {
    const id = `n${counter++}`
    const color = NODE_COLORS[Math.min(level, NODE_COLORS.length - 1)]
    nodes.push({
      id,
      position: { x: x - NODE_WIDTH / 2, y },
      data: { label: node.keyword },
      style: {
        background: color,
        color: '#fff',
        border: 'none',
        borderRadius: level === 0 ? 14 : 8,
        padding: level === 0 ? '10px 18px' : '6px 12px',
        fontSize: level === 0 ? 15 : 12,
        fontWeight: level <= 1 ? 700 : 500,
        width: NODE_WIDTH,
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
    })

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        type: 'smoothstep',
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      })
    }

    if (node.children?.length) {
      const total = node.children.reduce((s, c) => s + subtreeWidth(c), 0)
      let cx = x - total / 2
      node.children.forEach((child) => {
        const w = subtreeWidth(child)
        traverse(child, id, cx + w / 2, y + V_GAP, level + 1)
        cx += w
      })
    }
  }

  traverse(root, null, 0, 0, 0)
  return { nodes, edges }
}

export default function MindmapView({ summary, keyDecisions, actionItems }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/mindmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ summary, key_decisions: keyDecisions, action_items: actionItems }),
      })
      if (!res.ok) throw new Error('마인드맵 생성 실패')
      const tree = await res.json()
      const { nodes: n, edges: e } = buildFlow(tree)
      setNodes(n)
      setEdges(e)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [summary, keyDecisions, actionItems])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-50 rounded-xl border border-gray-200">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">마인드맵 생성 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-80 bg-red-50 rounded-xl border border-red-100">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-2">{error}</p>
          <button onClick={load} className="text-xs text-blue-600 hover:underline">다시 시도</button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[480px] rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable
        minZoom={0.3}
        maxZoom={2}
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls showInteractive={false} />
        <MiniMap nodeColor={(n) => n.style?.background || '#94a3b8'} maskColor="rgba(240,244,248,0.7)" />
      </ReactFlow>
    </div>
  )
}
