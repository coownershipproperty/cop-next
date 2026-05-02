import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminLogin() {
  const [email, setEmail] = useState('info@domosno.com')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-2xl font-semibold text-stone-800 tracking-tight">COP Admin</div>
          <p className="text-sm text-stone-500 mt-1">Co-Ownership Properties</p>
        </div>

        {sent ? (
          <div className="bg-white border border-stone-200 rounded-xl p-8 text-center shadow-sm">
            <div className="text-3xl mb-4">✉️</div>
            <p className="text-stone-700 font-medium">Check your inbox</p>
            <p className="text-stone-500 text-sm mt-2">
              We sent a magic link to <span className="font-medium text-stone-700">{email}</span>
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 text-sm text-stone-400 hover:text-stone-600 underline underline-offset-2"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="bg-white border border-stone-200 rounded-xl p-8 shadow-sm">
            <div className="mb-5">
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
              />
            </div>
            {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-800 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
