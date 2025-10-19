import React, { useState } from 'react'
import { api } from '../lib/apiBase'

export default function Lock({ onUnlock }){
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const login = async (e)=>{
    e.preventDefault()
    setLoading(true)
    setError("")
    try{
  const res = await fetch(api('api/auth/login'),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ password })
      })
      if(!res.ok) throw new Error('Invalid credentials')
      const data = await res.json()
      localStorage.setItem('passop_token', data.token)
      onUnlock(data.token)
    }catch(err){
      setError('Invalid password. Please try again.')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className='min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden'>
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className='w-full max-w-md'>
        {/* Logo and branding */}
        <div className='text-center mb-8 animate-fade-in'>
          <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-lg mb-4 animate-bounce-slow'>
            <lord-icon
              src="https://cdn.lordicon.com/rwotyanb.json"
              trigger="loop"
              delay="2000"
              colors="primary:#ffffff,secondary:#ffffff"
              style={{ width: '48px', height: '48px' }}>
            </lord-icon>
          </div>
          <h1 className='text-4xl font-extrabold tracking-tight mb-2'>
            <span className='text-green-500'>&lt;</span>
            Pass
            <span className='text-green-500'>OP/&gt;</span>
          </h1>
          <p className='text-slate-600 text-sm'>Your Secure Password Manager</p>
        </div>

        {/* Login form */}
        <form onSubmit={login} className='bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl p-8 animate-slide-up'>
          <div className='mb-6'>
            <h2 className='text-2xl font-bold text-slate-800 mb-2'>Welcome Back</h2>
            <p className='text-sm text-slate-600'>Enter your master password to unlock</p>
          </div>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2' htmlFor='master'>
                Master Password
              </label>
              <div className='relative'>
                <input 
                  id='master' 
                  type={showPassword ? 'text' : 'password'}
                  className='w-full rounded-xl border-2 border-slate-200 px-4 py-3 pr-12 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 bg-white/50' 
                  placeholder='Enter your master password' 
                  value={password} 
                  onChange={(e)=>setPassword(e.target.value)}
                  autoFocus
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className='w-5 h-5 text-slate-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                    </svg>
                  ) : (
                    <svg className='w-5 h-5 text-slate-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                    </svg>
                  )}
                </button>
              </div>
              {error && (
                <div className='flex items-center gap-2 mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 animate-shake'>
                  <svg className='w-4 h-4 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button 
              type='submit'
              disabled={loading || !password} 
              className='relative w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-slate-400 disabled:to-slate-300 text-white font-semibold rounded-xl px-4 py-3 shadow-lg hover:shadow-xl disabled:shadow-none active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden group'
            >
              {loading && (
                <svg className='animate-spin h-5 w-5' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                </svg>
              )}
              <span>{loading ? 'Unlocking...' : 'Unlock'}</span>
              {!loading && (
                <svg className='w-5 h-5 group-hover:translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
                </svg>
              )}
            </button>
          </div>

          {/* Security features */}
          <div className='mt-6 pt-6 border-t border-slate-200'>
            <p className='text-xs text-slate-500 text-center mb-3'>Protected with</p>
            <div className='flex items-center justify-center gap-6 text-xs text-slate-600'>
              <div className='flex items-center gap-1.5'>
                <svg className='w-4 h-4 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                </svg>
                <span>AES-256</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <svg className='w-4 h-4 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z' clipRule='evenodd' />
                </svg>
                <span>JWT Auth</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <svg className='w-4 h-4 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                </svg>
                <span>Auto-Lock</span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer note */}
        <p className='text-xs text-slate-500 text-center mt-6'>
          Make sure your backend is configured with <code className='bg-slate-200 px-1.5 py-0.5 rounded'>AUTH_PASSWORD_HASH</code>
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out 0.2s both; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .delay-500 { animation-delay: 500ms; }
        .delay-1000 { animation-delay: 1000ms; }
      `}</style>
    </div>
  )
}
