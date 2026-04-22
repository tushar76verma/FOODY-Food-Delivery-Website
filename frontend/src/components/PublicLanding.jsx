import React from 'react'
import { FaArrowRight, FaLocationDot, FaMagnifyingGlass } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import { categories } from '../category';

function PublicLanding() {
  const navigate = useNavigate()

  return (
    <div className='min-h-screen text-[var(--slate-black)] public-landing-wood'>
      <section className='w-full bg-transparent px-4 pb-14 pt-6 text-[var(--slate-black)] md:px-8 lg:px-12 hero-bg'>
        <div className='mx-auto max-w-7xl rounded-[36px] bg-transparent px-5 py-6 md:px-8 md:py-8'>
          <div className='flex flex-col gap-6'>
            <nav className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <div className='flex items-center gap-3'>
                <div className='flex h-14 w-14 items-center justify-center rounded-[18px] bg-white text-3xl font-black text-[var(--teal-dark)] shadow-lg'>
                  F
                </div>
                <div>
                  <h1 className='text-4xl font-black tracking-tight text-white'>Foody</h1>
                  <p className='text-sm font-medium text-white/70'>Teal-forward, fresh and modern</p>
                </div>
              </div>

              <div className='flex flex-wrap items-center gap-3'>
                <button className='rounded-[20px] border border-white/60 px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white/10' onClick={() => navigate("/signup")} type="button">
                  Register
                </button>
                <button className='rounded-[20px] bg-[var(--slate-black)] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:opacity-90' onClick={() => navigate("/signin")} type="button">
                  Login
                </button>
              </div>
            </nav>

            <div className='relative flex min-h-[400px] items-center justify-center py-4 text-center'>
              <div className='relative z-20 mx-auto max-w-3xl hero-copy'>
                <p className='text-sm font-bold uppercase tracking-[0.3em] text-white/80 mb-4'>Foody Delivery Platform</p>
                <h2 className='text-4xl md:text-6xl leading-tight text-white font-black italic' style={{ fontFamily: "'Georgia', 'Times New Roman', serif", textShadow: '0 2px 24px rgba(255,255,255,0.18)' }}>
                  "Your cravings, delivered<br />to your doorstep."
                </h2>
                <p className='mt-6 text-base leading-relaxed text-white/80 md:text-lg max-w-2xl mx-auto'>
                  Search dishes, explore shops, add items to cart, checkout online or cash on delivery, and track your orders live after login.
                </p>
              </div>
            </div>
            <style>{`
              .hero-bg {
                position: relative;
                overflow: hidden;
                background: transparent;
              }
              .public-landing-wood {
                background:
                  radial-gradient(900px 420px at 12% 10%, rgba(255, 255, 255, 0.22), transparent 68%),
                  radial-gradient(760px 360px at 88% 14%, rgba(0, 170, 160, 0.18), transparent 70%),
                  radial-gradient(820px 420px at 50% 100%, rgba(0, 125, 118, 0.16), transparent 72%),
                  linear-gradient(135deg, #1fc6c0 0%, #16b7b1 40%, #0fa7a1 100%);
              }
              .hero-copy {
                animation: heroFadeUp 900ms ease-out both;
              }

              @keyframes heroFadeUp {
                0% { opacity: 0; transform: translateY(24px); }
                100% { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            <div className='mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-[1.05fr_1.35fr]'>
              <div className='flex min-h-[88px] items-center justify-between rounded-[28px] border border-white/30 bg-white px-5 py-4 text-left text-[var(--slate-black)] shadow-[0_16px_30px_rgba(0,0,0,0.12)]'>
                <div className='flex items-center gap-4'>
                  <span className='flex h-12 w-12 items-center justify-center rounded-full bg-[var(--teal-tint)] text-[var(--teal-dark)]'>
                    <FaLocationDot size={22} />
                  </span>
                  <div>
                    <p className='text-xs font-bold uppercase tracking-[0.2em] text-[var(--teal-dark)]'>Delivery Location</p>
                    <p className='text-lg font-bold'>Use current location after login</p>
                    <p className='text-sm text-gray-500'>Nearby shops and items are shown by city.</p>
                  </div>
                </div>
                <FaArrowRight className='text-[var(--teal-dark)]' />
              </div>

              <div className='flex min-h-[88px] items-center justify-between rounded-[28px] border border-white/30 bg-white px-5 py-4 text-left text-[var(--slate-black)] shadow-[0_16px_30px_rgba(0,0,0,0.12)]'>
                <div className='flex items-center gap-4'>
                  <span className='flex h-12 w-12 items-center justify-center rounded-full bg-[var(--teal-tint)] text-[var(--teal-dark)]'>
                    <FaMagnifyingGlass size={20} />
                  </span>
                  <div>
                    <p className='text-xs font-bold uppercase tracking-[0.2em] text-[var(--teal-dark)]'>Smart Search</p>
                    <p className='text-lg font-bold'>Search restaurants, items or categories</p>
                    <p className='text-sm text-gray-500'>Everything opens after account login or registration.</p>
                  </div>
                </div>
                <FaArrowRight className='text-[var(--teal-dark)]' />
              </div>
            </div>

            <div className='mx-auto grid w-full max-w-5xl gap-4 mt-4 md:grid-cols-3'>
              <div className='rounded-[28px] bg-[var(--teal-tint)] px-6 py-6'>
                <p className='text-xs font-bold uppercase tracking-[0.25em] text-[var(--teal-dark)] mb-2'>Upto 60% Off</p>
                <h3 className='text-2xl font-black text-[var(--slate-black)] md:text-3xl'>FOOD DELIVERY</h3>
              </div>
              <div className='rounded-[28px] bg-[var(--teal-tint)] px-6 py-6'>
                <p className='text-xs font-bold uppercase tracking-[0.25em] text-[var(--teal-dark)] mb-2'>Fast Delivery</p>
                <h3 className='text-2xl font-black text-[var(--slate-black)] md:text-3xl'>INSTANT GROCERY</h3>
              </div>
              <div className='rounded-[28px] bg-[var(--teal-tint)] px-6 py-6'>
                <p className='text-xs font-bold uppercase tracking-[0.25em] text-[var(--teal-dark)] mb-2'>Status Updates</p>
                <h3 className='text-2xl font-black text-[var(--slate-black)] md:text-3xl'>LIVE TRACKING</h3>
              </div>
            </div>

            
          </div>
        </div>
      </section>

      <section className='mx-auto mt-8 w-full max-w-7xl px-4 pb-12 md:px-8'>
        <div className='rounded-[32px] bg-white px-6 py-7 shadow-[0_18px_45px_rgba(20,20,20,0.08)]'>
          <div className='mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
            <div>
              <p className='text-sm font-bold uppercase tracking-[0.25em] text-[var(--teal-dark)]'>Platform Features</p>
              {/* <h2 className='text-3xl font-black'>Built around your current project features</h2> */}
            </div>
            <button className='rounded-[18px] bg-[var(--teal-dark)] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:opacity-90' onClick={() => navigate("/signup")} type="button">
              Create Account
            </button>
          </div>

          <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4'>
            <div className='rounded-[28px] bg-[var(--teal-tint)] p-5'>
              <h3 className='text-xl font-black'>Browse Categories</h3>
              <p className='mt-2 text-sm text-gray-600'>Users can explore your food categories and discover matching dishes.</p>
            </div>
            <div className='rounded-[28px] bg-[var(--teal-tint)] p-5'>
              <h3 className='text-xl font-black'>Shop by City</h3>
              <p className='mt-2 text-sm text-gray-600'>Nearby shops are shown based on the user city and selected location.</p>
            </div>
            <div className='rounded-[28px] bg-[var(--teal-tint)] p-5'>
              <h3 className='text-xl font-black'>Cart and Checkout</h3>
              <p className='mt-2 text-sm text-gray-600'>Food items keep the real item and shop ids so ordering stays correct.</p>
            </div>
            <div className='rounded-[28px] bg-[var(--teal-tint)] p-5'>
              <h3 className='text-xl font-black'>Live Tracking</h3>
              <p className='mt-2 text-sm text-gray-600'>Orders, owner updates, and delivery tracking continue after login.</p>
            </div>
          </div>

          <div className='mt-8'>
            <p className='mb-4 text-sm font-bold uppercase tracking-[0.25em] text-[var(--teal-dark)]'>Popular Categories</p>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6'>
              {categories.slice(0, 6).map((category) => (
                <div key={category.category} className='overflow-hidden rounded-[26px] bg-[var(--slate-black)] text-white shadow-lg'>
                  <img src={category.image} alt={category.category} className='h-36 w-full object-cover' />
                  <div className='p-4'>
                    <h3 className='text-lg font-black'>{category.category}</h3>
                    <p className='mt-1 text-sm text-white/70'>Available after login with your real account.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PublicLanding
