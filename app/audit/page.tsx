'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const PRICING: Record<string, Record<string, number>> = {
  cursor: { Hobby: 0, Pro: 20, Business: 40, Enterprise: 60 },
  'github-copilot': { Individual: 10, Business: 19, Enterprise: 39 },
  claude: { Free: 0, Pro: 20, Max: 100, Team: 30, Enterprise: 60, API: 0 },
  chatgpt: { Plus: 20, Team: 30, Enterprise: 60, API: 0 },
  gemini: { Pro: 20, Ultra: 30, API: 0 },
  windsurf: { Free: 0, Pro: 15, Teams: 35 },
}

const TOOL_NAMES: Record<string, string> = {
  cursor: 'Cursor', 'github-copilot': 'GitHub Copilot',
  claude: 'Claude', chatgpt: 'ChatGPT', gemini: 'Gemini', windsurf: 'Windsurf',
}

type Entry = { toolId: string; plan: string; monthlySpend: string; seats: string }
type AuditData = { teamSize: string; useCase: string; entries: Entry[] }

type Result = {
  tool: string
  plan: string
  currentSpend: number
  expectedPrice: number
  seats: number
  action: string
  savings: number
  reason: string
  status: 'overpaying' | 'optimal' | 'check'
}

function auditEntry(entry: Entry, teamSize: number, useCase: string): Result {
  const toolName = TOOL_NAMES[entry.toolId] || entry.toolId
  const seats = parseInt(entry.seats) || 1
  const currentSpend = parseFloat(entry.monthlySpend) || 0
  const officialPrice = (PRICING[entry.toolId]?.[entry.plan] || 0) * seats
  const pricePerSeat = PRICING[entry.toolId]?.[entry.plan] || 0

  let action = 'No change needed'
  let savings = 0
  let reason = 'You are on the right plan for your usage.'
  let status: Result['status'] = 'optimal'

  // Overpaying vs official price
  if (currentSpend > officialPrice && officialPrice > 0) {
    savings = currentSpend - officialPrice
    action = `You're paying $${savings.toFixed(0)}/mo more than the official price`
    reason = `Official ${toolName} ${entry.plan} is $${pricePerSeat}/seat × ${seats} seats = $${officialPrice}/mo`
    status = 'overpaying'
  }

  // Team plan for small teams
  if (entry.plan === 'Team' && seats <= 2) {
    const proSavings = (pricePerSeat - (PRICING[entry.toolId]?.['Pro'] || pricePerSeat)) * seats
    if (proSavings > 0) {
      savings = Math.max(savings, proSavings)
      action = `Downgrade to Pro plan`
      reason = `Team plan for ${seats} seats is overkill. Pro saves you $${proSavings}/mo with same features for small teams.`
      status = 'overpaying'
    }
  }

  // Business/Enterprise for small teams
  if ((entry.plan === 'Business' || entry.plan === 'Enterprise') && seats <= 3) {
    const proPrice = PRICING[entry.toolId]?.['Pro'] || 0
    if (proPrice > 0) {
      const potentialSavings = (pricePerSeat - proPrice) * seats
      if (potentialSavings > 0) {
        savings = Math.max(savings, potentialSavings)
        action = `Consider downgrading to Pro`
        reason = `${entry.plan} for ${seats} people adds cost without benefit at this team size. Pro plan saves $${potentialSavings}/mo.`
        status = 'overpaying'
      }
    }
  }

  // Cursor Business for coding — suggest Claude Code
  if (entry.toolId === 'cursor' && entry.plan === 'Business' && useCase === 'coding') {
    action = 'Consider Claude Code or Windsurf Pro'
    reason = `Cursor Business at $40/seat is premium. Windsurf Pro at $15/seat has similar AI completion — saves $${25 * seats}/mo for a coding team.`
    savings = Math.max(savings, 25 * seats)
    status = 'overpaying'
  }

  // ChatGPT Plus for coding — Claude Pro is better value
  if (entry.toolId === 'chatgpt' && entry.plan === 'Plus' && useCase === 'coding') {
    action = 'Switch to Claude Pro for coding tasks'
    reason = `Claude Pro ($20/mo) outperforms ChatGPT Plus for coding with longer context and better reasoning. Same price, better fit.`
    savings = 0
    status = 'check'
  }

  return {
    tool: toolName, plan: entry.plan, currentSpend,
    expectedPrice: officialPrice, seats, action, savings, reason, status
  }
}

export default function AuditPage() {
  const router = useRouter()
  const [results, setResults] = useState<Result[]>([])
  const [auditData, setAuditData] = useState<AuditData | null>(null)
  const [totalSavings, setTotalSavings] = useState(0)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('currentAudit')
    if (!raw) { router.push('/'); return }
    const data: AuditData = JSON.parse(raw)
    setAuditData(data)
    const computed = data.entries.map(e =>
      auditEntry(e, parseInt(data.teamSize), data.useCase)
    )
    setResults(computed)
    setTotalSavings(computed.reduce((sum, r) => sum + r.savings, 0))
  }, [router])

  const statusColor = (s: Result['status']) =>
    s === 'overpaying' ? 'border-red-500 bg-red-950' :
    s === 'check' ? 'border-yellow-500 bg-yellow-950' :
    'border-green-500 bg-green-950'

  const statusBadge = (s: Result['status']) =>
    s === 'overpaying' ? '🔴 Overpaying' :
    s === 'check' ? '🟡 Review' : '🟢 Optimal'

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Hero */}
        <div className="text-center bg-gray-900 rounded-2xl p-8">
          <p className="text-gray-400 mb-2">Your estimated monthly savings</p>
          <p className="text-6xl font-bold text-green-400">${totalSavings.toFixed(0)}</p>
          <p className="text-gray-400 mt-1">= ${(totalSavings * 12).toFixed(0)} per year</p>
          {totalSavings === 0 && (
            <p className="text-green-400 mt-3 font-medium">✅ You're spending well. No obvious waste found.</p>
          )}
        </div>

        {/* Per tool results */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Breakdown by tool</h2>
          {results.map((r, i) => (
            <div key={i} className={`rounded-xl border p-5 space-y-2 ${statusColor(r.status)}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">{r.tool} — {r.plan}</span>
                <span className="text-sm">{statusBadge(r.status)}</span>
              </div>
              <div className="text-sm text-gray-300">
                You pay: <span className="text-white font-medium">${r.currentSpend}/mo</span>
                {r.expectedPrice > 0 && <> · Official price: <span className="text-white font-medium">${r.expectedPrice}/mo</span></>}
                {r.seats > 1 && <> · {r.seats} seats</>}
              </div>
              <div className="text-sm font-medium">{r.action}</div>
              <div className="text-sm text-gray-400">{r.reason}</div>
              {r.savings > 0 && (
                <div className="text-green-400 font-bold">Save ${r.savings.toFixed(0)}/mo</div>
              )}
            </div>
          ))}
        </div>

        {/* Credex CTA for high savings */}
        {totalSavings >= 500 && (
          <div className="bg-green-900 border border-green-500 rounded-xl p-6 text-center">
            <h3 className="text-xl font-bold text-green-300 mb-2">💰 You could save ${totalSavings.toFixed(0)}/mo</h3>
            <p className="text-gray-300 mb-4">Credex sells discounted AI credits (Cursor, Claude, ChatGPT Enterprise) at up to 40% off retail. Book a free consultation.</p>
            <a href="https://credex.rocks" target="_blank" className="inline-block bg-green-500 text-black font-bold px-6 py-3 rounded-lg hover:bg-green-400 transition">
              Book Free Credex Consultation →
            </a>
          </div>
        )}

        {/* Email capture */}
        {!submitted ? (
          <div className="bg-gray-900 rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-lg">
              {totalSavings < 100
                ? '📬 Get notified when new optimizations apply to your stack'
                : '📧 Get your full audit report by email'}
            </h3>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-gray-800 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={() => { if (email) setSubmitted(true) }}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-lg transition"
            >
              Send My Report
            </button>
          </div>
        ) : (
          <div className="bg-green-900 border border-green-600 rounded-xl p-6 text-center">
            <p className="text-green-300 font-bold text-lg">✅ Report sent to {email}</p>
            <p className="text-gray-400 text-sm mt-1">Check your inbox in a few minutes.</p>
          </div>
        )}

        <button
          onClick={() => router.push('/')}
          className="w-full border border-gray-700 rounded-xl py-3 text-gray-400 hover:text-white transition"
        >
          ← Edit my tools
        </button>
      </div>
    </main>
  )
}