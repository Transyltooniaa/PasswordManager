
import Footer from './components/Footer'
import Manager from './components/Manager'
import Navbar from './components/Navbar'
import Lock from './components/Lock'
import React, { useEffect, useRef } from 'react'
import { useState, useMemo, createContext, useContext } from 'react'


const AuthContext = createContext({ token: '', setToken: ()=>{} })
export const useAuth = () => useContext(AuthContext)


function App() {
  const [token, setToken] = useState(() => localStorage.getItem('passop_token') || '')
  const value = useMemo(()=>({ token, setToken }), [token])

  // Idle timeout logic
  const idleTimeout = 1 * 60 * 1000; // 5 minutes
  const timerRef = useRef(null)

  useEffect(() => {
    if (!token) return;
    // Handler to reset timer
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        localStorage.removeItem('passop_token');
        setToken('');
      }, idleTimeout);
    };
    // List of events that indicate activity
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer(); // Start timer on mount
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [token]);

  return (
    <AuthContext.Provider value={value}>
      <Navbar/>
      {token ? <Manager/> : <Lock onUnlock={(t)=>setToken(t)}/>}    
      <Footer/>
    </AuthContext.Provider>
  )
}


export default App
