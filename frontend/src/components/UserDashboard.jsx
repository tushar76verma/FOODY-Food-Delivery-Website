import React, { useEffect, useRef, useState } from 'react'
import Nav from './Nav'
import { categories } from '../category'
import CategoryCard from './CategoryCard'
import { FaCircleChevronLeft, FaCircleChevronRight } from "react-icons/fa6";
import { useSelector } from 'react-redux';
import FoodCard from './FoodCard';
import { useNavigate } from 'react-router-dom';
import image1 from '../assets/image1.jpg'
import image5 from '../assets/image5.jpg'
import image6 from '../assets/image6.jpg'
import image11 from '../assets/image11.jpg'

function UserDashboard() {
  const { currentCity, shopInMyCity, itemsInMyCity } = useSelector(state => state.user)
  const cateScrollRef = useRef()
  const shopScrollRef = useRef()
  const navigate = useNavigate()
  const [showLeftCateButton, setShowLeftCateButton] = useState(false)
  const [showRightCateButton, setShowRightCateButton] = useState(false)
  const [showLeftShopButton, setShowLeftShopButton] = useState(false)
  const [showRightShopButton, setShowRightShopButton] = useState(false)
  const [updatedItemsList, setUpdatedItemsList] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("All")

  const handleFilterByCategory = (category) => {
    setSelectedCategory(category)
    if (category == "All") {
      setUpdatedItemsList(itemsInMyCity)
    } else {
      const filteredList = itemsInMyCity?.filter(i => i.category === category)
      setUpdatedItemsList(filteredList)
    }
    document.getElementById("food-items-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  useEffect(() => {
    if (selectedCategory === "All") {
      setUpdatedItemsList(itemsInMyCity)
    } else {
      setUpdatedItemsList(itemsInMyCity?.filter(item => item.category === selectedCategory))
    }
  }, [itemsInMyCity, selectedCategory])

  const updateButton = (ref, setLeftButton, setRightButton) => {
    const element = ref.current
    if (element) {
      setLeftButton(element.scrollLeft > 0)
      setRightButton(element.scrollLeft + element.clientWidth < element.scrollWidth)
    }
  }

  const scrollHandler = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction == "left" ? -260 : 260,
        behavior: "smooth"
      })
    }
  }

  useEffect(() => {
    const cateElement = cateScrollRef.current
    const shopElement = shopScrollRef.current

    const handleCateScroll = () => {
      updateButton(cateScrollRef, setShowLeftCateButton, setShowRightCateButton)
    }

    const handleShopScroll = () => {
      updateButton(shopScrollRef, setShowLeftShopButton, setShowRightShopButton)
    }

    if (cateElement) {
      handleCateScroll()
      cateElement.addEventListener('scroll', handleCateScroll)
    }

    if (shopElement) {
      handleShopScroll()
      shopElement.addEventListener('scroll', handleShopScroll)
    }

    return () => {
      cateElement?.removeEventListener("scroll", handleCateScroll)
      shopElement?.removeEventListener("scroll", handleShopScroll)
    }
  }, [])

  return (
    <div className='w-screen min-h-screen bg-[var(--bg-soft)] text-[var(--slate-black)] overflow-y-auto pt-[92px]'>
      <Nav />

      <section className='w-full bg-[#f4ece8] px-4 pb-10 pt-5 md:px-8 lg:px-12'>
        <div className='mx-auto max-w-7xl rounded-[36px] bg-[#f8f1ed] px-6 py-8 shadow-[0_20px_55px_rgba(46,51,51,0.12)] md:px-10'>
          <div className='grid gap-8 lg:grid-cols-[1.15fr_0.85fr]'>
            <div className='space-y-6'>
              <div className='space-y-3'>
                <h1 className='text-4xl font-black leading-tight text-[#1f3a4d] md:text-7xl'>
                  Your Daily Dose of
                </h1>
                <p className='text-5xl font-bold italic text-[#ff7a2f] md:text-7xl'>Delicious</p>
              </div>

              <div className='flex flex-wrap gap-3 text-sm text-[#334155]'>
                <div className='flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm'>
                  <img src={image1} alt="Margarita Pizza" className='h-8 w-8 rounded-full object-cover' />
                  <span>Margarita Pizza</span>
                </div>
                <div className='flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm'>
                  <img src={image11} alt="Grilled Caesar Salad" className='h-8 w-8 rounded-full object-cover' />
                  <span>Grilled Caesar Salad</span>
                </div>
                <div className='flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm'>
                  <img src={image5} alt="Burger Bliss Combo" className='h-8 w-8 rounded-full object-cover' />
                  <span>Burger Bliss Combo</span>
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='rounded-[22px] bg-[#f2b78c] p-4'>
                  
                  <img src={image6} alt="Best Chef" className='h-40 w-full rounded-[18px] object-cover' />
                </div>
                <div className='rounded-[22px] bg-[#c8e6a7] p-4'>
                  
                  <img src={image11} alt="Explorer Food" className='h-40 w-full rounded-[18px] object-cover' />
                </div>
              </div>
            </div>

            <div className='flex flex-col items-start justify-between gap-6'>
              <p className='max-w-xs text-sm font-medium text-[#334155] md:ml-auto'>
                Discover handcrafted meals made with love. Browse our menu and find your next favorite dish.
              </p>
              <img src={image5} alt="Featured Food" className='w-full rounded-[30px] object-cover shadow-lg lg:h-[430px]' />
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto mt-8 w-full max-w-7xl px-4 md:px-8'>
        <div className='rounded-[32px] bg-white px-6 py-7 shadow-[0_18px_45px_rgba(20,20,20,0.08)]'>
          <div className='mb-6 flex items-center justify-between gap-4'>
            <div>
              <p className='text-sm font-bold uppercase tracking-[0.25em] text-[var(--teal-dark)]'>Browse Categories</p>
              <h2 className='text-3xl font-black'>Pick what you are craving</h2>
            </div>
            <div className='hidden items-center gap-3 md:flex'>
              {showLeftCateButton && <button className='flex h-12 w-12 items-center justify-center rounded-full bg-[var(--teal-tint)] text-[var(--teal-dark)] transition hover:bg-[var(--teal-dark)] hover:text-white' onClick={() => scrollHandler(cateScrollRef, "left")}><FaCircleChevronLeft size={20} /></button>}
              {showRightCateButton && <button className='flex h-12 w-12 items-center justify-center rounded-full bg-[var(--teal-tint)] text-[var(--teal-dark)] transition hover:bg-[var(--teal-dark)] hover:text-white' onClick={() => scrollHandler(cateScrollRef, "right")}><FaCircleChevronRight size={20} /></button>}
            </div>
          </div>
          <div className='flex gap-4 overflow-x-auto pb-2' ref={cateScrollRef}>
            {categories.map((cate, index) => (
              <CategoryCard
                name={cate.category}
                image={cate.image}
                key={index}
                active={selectedCategory === cate.category}
                onClick={() => handleFilterByCategory(cate.category)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className='mx-auto mt-8 w-full max-w-7xl px-4 md:px-8' id="shop-section">
        <div className='rounded-[32px] bg-[var(--slate-black)] px-6 py-7 text-white shadow-[0_22px_50px_rgba(31,36,49,0.18)]'>
          <div className='mb-6 flex items-center justify-between gap-4'>
            <div>
              <p className='text-sm font-bold uppercase tracking-[0.25em] text-[var(--teal-tint)]'>Nearby Stores</p>
              <h2 className='text-3xl font-black'>{currentCity ? `Best shops in ${currentCity}` : "Top shops around you"}</h2>
            </div>
            <div className='hidden items-center gap-3 md:flex'>
              {showLeftShopButton && <button className='flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[var(--teal-primary)]' onClick={() => scrollHandler(shopScrollRef, "left")}><FaCircleChevronLeft size={20} /></button>}
              {showRightShopButton && <button className='flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[var(--teal-primary)]' onClick={() => scrollHandler(shopScrollRef, "right")}><FaCircleChevronRight size={20} /></button>}
            </div>
          </div>

          <div className='flex gap-5 overflow-x-auto pb-2' ref={shopScrollRef}>
            {shopInMyCity?.map((shop) => (
              <button key={shop._id} className='group min-w-[280px] overflow-hidden rounded-[28px] bg-white text-left text-[var(--slate-black)] shadow-lg transition hover:-translate-y-1' onClick={() => navigate(`/shop/${shop._id}`)}>
                <div className='relative h-[190px] overflow-hidden'>
                  <img src={shop.image} alt={shop.name} className='h-full w-full object-cover transition duration-500 group-hover:scale-105' />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent' />
                  <p className='absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold tracking-[0.18em] text-[var(--teal-dark)]'>OPEN NOW</p>
                </div>
                <div className='space-y-2 p-5'>
                  <h3 className='text-2xl font-black'>{shop.name}</h3>
                  <p className='truncate text-sm text-gray-500'>{shop.address}</p>
                  <div className='flex items-center justify-between pt-2'>
                    <span className='text-sm font-semibold text-gray-400'>{shop.city}</span>
                    <span className='text-sm font-bold text-[var(--teal-dark)]'>View Menu</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className='mx-auto mt-8 w-full max-w-7xl px-4 pb-12 md:px-8' id="food-items-section">
        <div className='rounded-[32px] bg-white px-6 py-7 shadow-[0_18px_45px_rgba(20,20,20,0.08)]'>
          <div className='mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
            <div>
              <p className='text-sm font-bold uppercase tracking-[0.25em] text-[var(--teal-dark)]'>Curated For You</p>
              <h2 className='text-3xl font-black'>Suggested food items</h2>
            </div>
            <p className='text-sm text-gray-500'>
              Showing {updatedItemsList?.length || 0} items {selectedCategory !== "All" ? `in ${selectedCategory}` : "from all categories"}.
            </p>
          </div>

          <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-4'>
            {updatedItemsList?.map((item) => (
              <FoodCard key={item._id} data={item} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default UserDashboard
