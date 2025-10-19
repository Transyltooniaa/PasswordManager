import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../App'
import { useRef } from 'react'
import { ToastContainer, toast, Bounce} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../lib/apiBase'

const Manager = () => {
  const ref = useRef()
  const passwordRef = useRef()
  const [form, setForm] = useState({site:"", username:"", password:"", tagsInput:""})
  const [passwordArray, setPasswordArray] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [filterBy, setFilterBy] = useState("all") // all | site | username | tag
  const { token } = useAuth()

  const filteredPasswords = useMemo(()=>{
    const q = search.trim().toLowerCase()
    const match = (item)=>{
      if(!q) return true
      if(filterBy==='site' || filterBy==='all'){
        if((item.site||'').toLowerCase().includes(q)) return true
      }
      if(filterBy==='username' || filterBy==='all'){
        if((item.username||'').toLowerCase().includes(q)) return true
      }
      if(filterBy==='tag' || filterBy==='all'){
        const tags = Array.isArray(item.tags) ? item.tags : (typeof item.tags==='string' ? item.tags.split(',') : [])
        if(tags.some(t => (t||'').toLowerCase().includes(q))) return true
      }
      return false
    }
    return passwordArray.filter(match)
  }, [passwordArray, search, filterBy])

  // Utilities to derive a favicon URL from a site
  const ensureProtocol = (url) => {
    if (!url) return ''
    try {
      // If it parses as-is, keep it
      return new URL(url).toString()
    } catch {
      // Prepend https if missing schema
      try { return new URL(`https://${url}`).toString() } catch { return '' }
    }
  }

  const getDomain = (url) => {
    const u = ensureProtocol(url)
    try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' }
  }

  const faviconCandidates = (site) => {
    const domain = getDomain(site)
    if (!domain) return []
    return [
      // DuckDuckGo icon service (ico)
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      // Google s2 favicons (png)
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    ]
  }

  const getPasswords = async()=>{
    try {
      setLoading(true)
      setError("")
  const req = await fetch(api('api/passwords'), { headers: { Authorization: `Bearer ${token}` } })
      if (!req.ok) throw new Error(`Failed to fetch (${req.status})`)
      const passwords = await req.json()
      setPasswordArray(passwords)
    } catch (e) {
      console.error(e)
      setError("Unable to load passwords. Ensure backend is running on :3000.")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    getPasswords()
    
  }, [])
  

  const showPassword= ()=>{
    passwordRef.current.type = "text"
    if(ref.current.src.includes("icons/eyecross.png")){
      ref.current.src = "/icons/eye.png"
      passwordRef.current.type = "password"       
    }
    else{
      passwordRef.current.type = "text"
      ref.current.src = "/icons/eyecross.png"
     
    }
  }

  // const savePassword = async()=>{
  //   if(form.site.length>3 && form.username.length>3 && form.password.length>3){
       
  //     //if any such id exists in the DB , delete it

  //     await fetch("http://localhost:3000/",
  //     {
  //       method:"DELETE",
  //       headers:{"Content-Type":"application/JSON"},
  //       body:JSON.stringify({id: form.id})
  //     })
    
  //   setPasswordArray([...passwordArray, {...form, id:uuidv4()}])
  //   await fetch("http://localhost:3000/",
  //     {
  //       method:"POST",
  //       headers:{"Content-Type":"application/json"},
  //       body:JSON.stringify({...form, id:uuidv4()})
  //     }
  //   )
    
  //   console.log([...passwordArray, form])
  //   setForm({site:"", username:"", password:""})
  //   toast('Password Saved Sucessfully!', {
  //     position: "top-right",
  //     autoClose: 5000,
  //     hideProgressBar: false,
  //     closeOnClick: false,
  //     pauseOnHover: true,
  //     draggable: true,
  //     progress: undefined,
  //     theme: "light",
  //     transition:Bounce
  //   });
  //   }
  //   else{
  //     toast.error('Error: Password not Saved!', {
  //       position: "top-right",
  //       autoClose: 5000,
  //       hideProgressBar: false,
  //       closeOnClick: false,
  //       pauseOnHover: true,
  //       draggable: true,
  //       progress: undefined,
  //       theme: "light",
  //       transition: Bounce,
  //     });
  //   }

  // }

  const canSave = useMemo(() => form.site.length>3 && form.username.length>3 && form.password.length>3, [form])

  const savePassword = async () => {
  if (canSave) {
    setSaving(true)
    let id = form.id || uuidv4(); // Use existing ID if editing, else new one

    const tags = (form.tagsInput || "").split(',').map(t=>t.trim()).filter(Boolean)
    const icons = faviconCandidates(form.site)
    const icon = icons[0] || ''

    if (form.id) {
      // Update existing
      await fetch(api(`api/passwords/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ site: form.site, username: form.username, password: form.password, tags, icon })
      })
    } else {
      // Create new
      await fetch(api('api/passwords'), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ site: form.site, username: form.username, password: form.password, id, tags, icon })
      })
    }

    // Refresh the password list from DB
    await getPasswords();

    // Clear the form
  setForm({ site: "", username: "", password: "", tagsInput: "" });

    toast('Password Saved Successfully!', {
      position: "top-right",
      autoClose: 5000,
      theme: "light",
      transition: Bounce
    });
  } else {
    toast.error('Error: Password not Saved!', {
      position: "top-right",
      autoClose: 5000,
      theme: "light",
      transition: Bounce
    });
  }
  setSaving(false)
};


  const deletePassword = async(id)=>{
    console.log("Deleting password with the id", id)
    let c = confirm("Do you really want to delete this password?")
    if(c){
      setPasswordArray(passwordArray.filter(item => item.id!== id))
      let res = await fetch(api(`api/passwords/${id}`),
      {
        method:"DELETE",
        headers:{"Content-Type":"application/JSON", Authorization: `Bearer ${token}`}
      })
      toast('Password Deleted Sucessfully!', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      transition:Bounce
    });
  }
    
  }

  const editPassword = (id)=>{
    console.log("Editing password with the id", id)   
    const item = passwordArray.filter(i => i.id === id)[0]
    const tagsInput = Array.isArray(item?.tags) ? item.tags.join(', ') : (item?.tags || '')
    setForm({site:item.site||'', username:item.username||'', password:item.password||'', id, tagsInput})
    // Keep existing list; when saved, list will refresh
    
  }

  const handleChange = (e)=>{
    setForm({...form, [e.target.name]:e.target.value})
  }

  const copyText = (text)=>{
    toast('Copied to Clipboard!', {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
    transition:Bounce
    });
    navigator.clipboard.writeText(text)
  }


  return (
    <>
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      transition="Bounce"
    />
    <div className="absolute inset-0 -z-10 h-full w-full bg-green-50 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[280px] w-[280px] sm:h-[340px] sm:w-[340px] rounded-full bg-green-400 opacity-20 blur-[100px]"></div>
    </div>

    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[87.2vh]">
        <h1 className='text-3xl sm:text-4xl font-extrabold text-center tracking-tight'>
            <span className='text-green-500'>&lt;</span>
                    Paas
            <span className='text-green-500'>OP/&gt;</span>
        </h1>
        <p className='text-green-900 text-base sm:text-lg text-center'>Your own Password Manager</p>

        <form
          onSubmit={(e)=>{e.preventDefault(); savePassword();}}
          className='flex flex-col text-black p-4 gap-6 items-center'
          aria-label='Add or edit password'
        >
            <label className='sr-only' htmlFor='site'>Website URL</label>
            <input value={form.site} onChange={handleChange} className='rounded-full border border-green-500 w-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400' placeholder='Enter website URL' type="url" name="site" id="site" required />
            <div className="flex flex-col md:flex-row w-full justify-between gap-6">
              <div className='flex-1'>
                <label className='sr-only' htmlFor='username'>Username</label>
                <input value={form.username} onChange={handleChange} className='rounded-full border border-green-500 w-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400' placeholder='Enter Username' type="text" name="username" id="username" required />
              </div>
              <div className="relative flex-1">
                <label className='sr-only' htmlFor='password'>Password</label>
                <input ref={passwordRef} value={form.password} onChange={handleChange} className='rounded-full border border-green-500 w-full px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-green-400' placeholder='Enter Password' type="password" name="password" id="password" required />
                <button type='button' onClick={showPassword} aria-label='Toggle password visibility' className='absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-green-100 active:scale-95'>
                  <img ref={ref} className='p-1' width={28} height={28} src="/icons/eye.png" alt="Toggle password visibility" />
                </button>
              </div>
            </div>
            <div className='w-full'>
              <label className='sr-only' htmlFor='tags'>Tags</label>
              <input value={form.tagsInput} onChange={handleChange} className='rounded-full border border-green-500 w-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400' placeholder='Tags (comma separated, e.g., work, banking)' type="text" name="tagsInput" id="tags" />
            </div>
            <button type='submit' disabled={!canSave || saving} className='flex justify-center items-center bg-green-600 hover:bg-green-500 disabled:bg-green-400 disabled:opacity-70 rounded-full cursor-pointer border-2 border-green-900 gap-2 w-full sm:w-auto px-8 py-2 active:scale-95 transition'>
              <lord-icon
                  src="https://cdn.lordicon.com/efxgwrkc.json"
                  trigger="hover">
              </lord-icon>
              {saving ? 'Saving...' : (form.id ? 'Update' : 'Save')}
            </button>
         </form>

         <div className="passwords">
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4'>
              <div className='flex items-center gap-3'>
                <h2 className='font-bold text-2xl'>Your Passwords</h2>
                {loading && <span className='text-sm text-green-900/80'>Loading...</span>}
              </div>
              <div className='flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto'>
                <div className='flex rounded-full border border-green-500 overflow-hidden w-full sm:w-80 bg-white'>
                  <span className='px-3 py-2 text-slate-500'>🔎</span>
                  <input
                    value={search}
                    onChange={(e)=>setSearch(e.target.value)}
                    className='flex-1 px-3 py-2 outline-none'
                    placeholder='Search by site, username, or tag'
                    aria-label='Search passwords'
                  />
                </div>
                <div className='inline-flex rounded-full bg-slate-100 p-1 text-sm'>
                  {['all','site','username','tag'].map(opt => (
                    <button
                      key={opt}
                      onClick={()=>setFilterBy(opt)}
                      className={`px-3 py-1 rounded-full capitalize ${filterBy===opt ? 'bg-white shadow border border-slate-200' : 'text-slate-700'}`}
                      type='button'
                      aria-pressed={filterBy===opt}
                    >{opt}</button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div className='text-sm text-red-700 bg-red-100 border border-red-200 rounded px-3 py-2 mb-4'>{error}</div>}
            {(!loading && passwordArray.length === 0) && <div className='text-sm text-slate-700 bg-white/60 border border-slate-200 rounded px-3 py-2'>No Passwords to show</div>}
            {passwordArray.length != 0 && 
            <div className='overflow-x-auto rounded-md border border-green-200 shadow-sm'>
            <table className="table-auto w-full">
              <thead className='bg-green-800 text-white text-left'>
                <tr>
                  <th className='p-3'>Site</th>
                  <th className='p-3'>Username</th>
                  <th className='p-3'>Tags</th>
                  <th className='p-3'>Password</th>
                  <th className='p-3 text-center'>Actions</th>
                </tr>
              </thead>
              <tbody className='bg-green-50'>
                {filteredPasswords.map((item, index)=>{

                  return <tr key={index} className='border-t border-green-200 hover:bg-white/70'>
                  <td className='py-2 px-3'> 
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={item.icon || faviconCandidates(item.site)[0] || '/icons/globe.svg'}
                        alt="site icon"
                        className='w-5 h-5 rounded-sm flex-none'
                        onError={(e)=>{
                          const fallbacks = [
                            ...(item.icon ? [] : [faviconCandidates(item.site)[1]]),
                            '/icons/globe.svg'
                          ].filter(Boolean)
                          // Consume one fallback per error
                          const next = fallbacks.shift()
                          if (next && e.currentTarget.src !== next) e.currentTarget.src = next
                        }}
                      />
                      <a className='text-green-900 hover:underline break-all truncate' href={ensureProtocol(item.site)} target='_blank' rel='noreferrer'>{item.site}</a>
                      <button aria-label='Copy site' className='size-7 cursor-pointer rounded hover:bg-green-100 active:scale-95' onClick={()=>{copyText(item.site)}}>
                        <lord-icon
                            style={{"height": "25px", "width":"25px", "paddingTop":"3px", "paddingLeft":"3px"}}
                            src="https://cdn.lordicon.com/xuoapdes.json"
                            trigger="hover">
                        </lord-icon>
                      </button>
                    </div>
                  </td>
                  <td className='py-2 px-3'>
                    <div className="flex items-center gap-2">
                      <span className='break-all'>{item.username}</span>
                      <button aria-label='Copy username' className='size-7 cursor-pointer rounded hover:bg-green-100 active:scale-95' onClick={()=>{copyText(item.username)}}>
                        <lord-icon
                            style={{"height": "25px", "width":"25px", "paddingTop":"3px", "paddingLeft":"3px"}}
                            src="https://cdn.lordicon.com/xuoapdes.json"
                            trigger="hover">
                        </lord-icon>
                      </button>    
                    </div>
                  </td>
                  <td className='py-2 px-3'>
                    <div className='flex flex-wrap gap-1'>
                      {(Array.isArray(item.tags)? item.tags : (typeof item.tags==='string'? item.tags.split(','):[])).filter(Boolean).map((t, i)=> (
                        <span key={i} className='px-2 py-0.5 rounded-full text-xs bg-green-200 text-green-900 border border-green-300'>{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className='py-2 px-3'>
                    <div className="flex items-center gap-2">
                      <span>{"*".repeat((item.password || "").length)}</span>
                      <button aria-label='Copy password' className='size-7 cursor-pointer rounded hover:bg-green-100 active:scale-95' onClick={()=>{copyText(item.password)}}>
                        <lord-icon
                            style={{"height": "25px", "width":"25px", "paddingTop":"3px", "paddingLeft":"3px"}}
                            src="https://cdn.lordicon.com/xuoapdes.json"
                            trigger="hover">
                        </lord-icon>
                      </button>
                    </div>
                  </td>
                  <td className='py-2 px-3 text-center whitespace-nowrap'>
                    <button aria-label='Edit password' className='cursor-pointer mx-1 inline-flex rounded hover:bg-green-100 active:scale-95 p-1' onClick={()=>{editPassword(item.id)}}>
                      <lord-icon
                        style={{"height": "25px", "width":"25px"}}
                        src="https://cdn.lordicon.com/erxuunyq.json"
                        trigger="hover">
                      </lord-icon>
                    </button>
                    <button aria-label='Delete password' className='cursor-pointer mx-1 inline-flex rounded hover:bg-red-100 active:scale-95 p-1' onClick={()=>{deletePassword(item.id)}}>
                      <lord-icon
                          style={{"height": "25px", "width":"25px"}}
                          src="https://cdn.lordicon.com/xyfswyxf.json"
                          trigger="hover">
                      </lord-icon>
                    </button>
                  </td>
                  </tr>
               
                })}

              </tbody>
            </table>
            </div> }
         </div>

    </div>
    </>
  )
}

export default Manager
