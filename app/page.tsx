'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const TOOLS = [
  { id: 'cursor', name: 'Cursor', plans: ['Hobby', 'Pro', 'Business', 'Enterprise'] },
  { id: 'github-copilot', name: 'GitHub Copilot', plans: ['Individual', 'Business', 'Enterprise'] },
  { id: 'claude', name: 'Claude', plans: ['Free', 'Pro', 'Max', 'Team', 'Enterprise', 'API'] },
  { id: 'chatgpt', name: 'ChatGPT', plans: ['Plus', 'Team', 'Enterprise', 'API'] },
  { id: 'gemini', name: 'Gemini', plans: ['Pro', 'Ultra', 'API'] },
  { id: 'windsurf', name: 'Windsurf', plans: ['Free', 'Pro', 'Teams'] },
]

type ToolEntry = {
  toolId: string
  plan: string
  monthlySpend: string
  seats: string
}

export default function Home() {
  const router = useRouter()
  const [teamSize, setTeamSize] = useState('')
  const [useCase, setUseCase] = useState('')
  const [entries, setEntries] = useState<ToolEntry[]>([
    { toolId: 'cursor', plan: 'Pro', monthlySpend: '', seats: '1' }
  ])

  useEffect(() => {
    const saved = localStorage.getItem('auditForm')
    if (saved) {
      const data = JSON.parse(saved)
      setTeamSize(data.teamSize || '')
      setUseCase(data.useCase || '')
      setEntries(data.entries || [])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('auditForm', JSON.stringify({ teamSize, useCase, entries }))
  }, [teamSize, useCase, entries])

  const addTool = () => {
    setEntries([...entries, { toolId: 'chatgpt', plan: 'Plus', monthlySpend: '', seats: '1' }])
  }

  const removeTool = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, field: keyof ToolEntry, value: string) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'toolId') updated[index].plan = TOOLS.find(t => t.id === value)?.plans[0] || ''
    setEntries(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const auditData = { teamSize, useCase, entries, createdAt: Date.now() }
    localStorage.setItem('currentAudit', JSON.stringify(auditData))
    router.push('/audit')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-green-400 mb-2">💸 AI Spend Audit</h1>
          <p className="text-gray-400">Find out if you're overpaying for AI tools. Free, instant, no login needed.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-900 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold">About your team</h2>
            <div>
              <label className="text-sm text-gray-400">Team size</label>
              <input
                type="number"
                value={teamSize}
                onChange={e => setTeamSize(e.target.value)}
                placeholder="e.g. 5"
                className="mt-1 w-full bg-gray-800 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Primary use case</label>
              <select
                value={useCase}
                onChange={e => setUseCase(e.target.value)}
                className="mt-1 w-full bg-gray-800 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select one</option>
                <option value="coding">Coding</option>
                <option value="writing">Writing</option>
                <option value="data">Data analysis</option>
                <option value="research">Research</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your AI tools</h2>
            {entries.map((entry, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Tool {i + 1}</span>
                  {entries.length > 1 && (
                    <button type="button" onClick={() => removeTool(i)} className="text-red-400 text-sm">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-400">Tool</label>
                    <select
                      value={entry.toolId}
                      onChange={e => updateEntry(i, 'toolId', e.target.value)}
                      className="mt-1 w-full bg-gray-800 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {TOOLS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Plan</label>
                    <select
                      value={entry.plan}
                      onChange={e => updateEntry(i, 'plan', e.target.value)}
                      className="mt-1 w-full bg-gray-800 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {TOOLS.find(t => t.id === entry.toolId)?.plans.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Monthly spend ($)</label>
                    <input
                      type="number"
                      value={entry.monthlySpend}
                      onChange={e => updateEntry(i, 'monthlySpend', e.target.value)}
                      placeholder="e.g. 40"
                      className="mt-1 w-full bg-gray-800 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Number of seats</label>
                    <input
                      type="number"
                      value={entry.seats}
                      onChange={e => updateEntry(i, 'seats', e.target.value)}
                      placeholder="e.g. 3"
                      className="mt-1 w-full bg-gray-800 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addTool}
              className="w-full border border-dashed border-gray-600 rounded-xl py-3 text-gray-400 hover:text-white hover:border-gray-400 transition"
            >
              + Add another tool
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-xl text-lg transition"
          >
            Run My Free Audit →
          </button>
        </form>
      </div>
    </main>
  )
}