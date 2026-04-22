import React from 'react'

function CategoryCard({ name, image, onClick, active = false }) {
  return (
    <button
      className={`group relative h-[220px] min-w-[180px] overflow-hidden rounded-[28px] text-left shadow-[0_16px_30px_rgba(20,20,20,0.08)] transition duration-300 hover:-translate-y-1 md:min-w-[210px] ${
        active ? "ring-4 ring-[var(--teal-primary)]" : ""
      }`}
      onClick={onClick}
      type="button"
    >
      <img src={image} alt={name} className='h-full w-full object-cover transition duration-500 group-hover:scale-105' />
      <div className='absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent' />
      <div className='absolute inset-x-0 bottom-0 p-4'>
        <div className='rounded-[22px] bg-white/92 px-4 py-3 backdrop-blur-md'>
          <p className='text-xs font-bold uppercase tracking-[0.18em] text-[var(--teal-dark)]'>Foody Picks</p>
          <h3 className='mt-1 text-xl font-black text-[var(--slate-black)]'>{name}</h3>
        </div>
      </div>
    </button>
  )
}

export default CategoryCard
