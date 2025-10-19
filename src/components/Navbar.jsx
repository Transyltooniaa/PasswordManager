import React from 'react'
import { useAuth } from '../App'

const Navbar = () => {
    const { token, setToken } = useAuth()

    const signOut = () => {
        localStorage.removeItem('passop_token')
        setToken('')
    }

    return (
        <nav className='bg-slate-800 text-white sticky top-0 z-20 shadow-sm shadow-slate-900/20'>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-4">
                    <a href="/" className='inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded'>
                        <span className='logo font-extrabold text-2xl tracking-tight'>
                            <span className='text-green-500'>&lt;</span>
                            Paas
                            <span className='text-green-500'>OP/&gt;</span>
                        </span>
                        <span className="sr-only">PassOP Home</span>
                    </a>

                                        <div className='flex items-center gap-3'>
                        <a
                            href="https://github.com/Transyltooniaa"
                            target="_blank"
                            rel="noreferrer"
                            className='text-white bg-green-600 hover:bg-green-500 rounded-full inline-flex justify-center items-center cursor-pointer active:scale-95 transition px-3 py-1.5 ring-1 ring-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400'
                        >
                            <img className='invert w-5 h-5' src="/icons/github.png" alt="GitHub" />
                            <span className='font-semibold px-2 hidden sm:inline'>GitHub</span>
                        </a>
                                                {token && (
                                                    <button
                                                        onClick={signOut}
                                                        className='text-white bg-red-600 hover:bg-red-500 rounded-full inline-flex justify-center items-center cursor-pointer active:scale-95 transition px-3 py-1.5 ring-1 ring-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400'
                                                        aria-label='Sign out'
                                                    >
                                                        <span className='font-semibold px-1 sm:px-2'>Sign out</span>
                                                    </button>
                                                )}
                    </div>
                </div>
            </div>
        </nav>
  )
}

export default Navbar
