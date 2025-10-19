import React from 'react'

const Footer = () => {
  return (
    <footer className='bg-slate-800 text-white text-center w-full mt-10 border-t border-white/10'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='logo font-extrabold text-2xl'>
          <span className='text-green-500'>&lt;</span>
          Paas
          <span className='text-green-500'>OP/&gt;</span>
        </div>

        <p className='flex gap-2 justify-center items-center mt-2 text-sm text-white/80'>
          {/* Created with
          <img src="/icons/heart.png" alt="heart" width={18} height={18} /> */}

        </p>
      </div>
    </footer>
  )
}

export default Footer
