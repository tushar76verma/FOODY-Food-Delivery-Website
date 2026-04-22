import React, { useState } from 'react'
import { FaLeaf, FaMinus, FaPlus, FaShoppingCart, FaStar } from "react-icons/fa";
import { FaDrumstickBite } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa6";
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/userSlice';

function FoodCard({ data }) {
  const [quantity, setQuantity] = useState(0)
  const dispatch = useDispatch()
  const { cartItems } = useSelector(state => state.user)
  const latestReview = [...(data.reviews || [])].reverse().find((review) => review.comment?.trim())

  const renderStars = (rating) => {
    const stars = []
    const normalizedRating = Math.round(rating)
    for (let i = 1; i <= 5; i++) {
      stars.push(
        (i <= normalizedRating) ? (
          <FaStar className='text-[#ffb400] text-base' key={i} />
        ) : (
          <FaRegStar className='text-[#ffb400] text-base' key={i} />
        )
      )
    }
    return stars
  }

  const handleIncrease = () => {
    const newQty = quantity + 1
    setQuantity(newQty)
  }

  const handleDecrease = () => {
    if (quantity > 0) {
      const newQty = quantity - 1
      setQuantity(newQty)
    }
  }

  const itemAlreadyInCart = cartItems.some(i => i.id == data._id)

  return (
    <div className='group overflow-hidden rounded-[28px] bg-white shadow-[0_18px_45px_rgba(20,20,20,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_55px_rgba(20,20,20,0.12)]'>
      <div className='relative h-[220px] overflow-hidden'>
        <div className='absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-[var(--slate-black)] shadow-md backdrop-blur-sm'>
          {data.foodType == "veg" ? <FaLeaf className='text-green-600' /> : <FaDrumstickBite className='text-red-600' />}
          <span>{data.foodType == "veg" ? "Veg" : "Non Veg"}</span>
        </div>
        <img src={data.image} alt={data.name} className='h-full w-full object-cover transition duration-500 group-hover:scale-105' />
        <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent' />
        <div className='absolute inset-x-0 bottom-0 p-5 text-white'>
          <p className='text-sm font-semibold uppercase tracking-[0.18em] text-white/90'>{data.category}</p>
          <h1 className='text-2xl font-black leading-tight'>{data.name}</h1>
        </div>
      </div>

      <div className='space-y-4 p-5'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-1'>
            {renderStars(data.rating?.average || 0)}
            <span className='ml-2 text-sm font-semibold text-gray-500'>
              {data.rating?.count || 0} reviews
            </span>
          </div>
          <span className='rounded-full bg-[var(--teal-tint)] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--teal-dark)]'>
            {itemAlreadyInCart ? "In Cart" : "Popular"}
          </span>
        </div>

        {latestReview?.comment && (
          <div className='rounded-2xl bg-[#fff7ef] px-4 py-3 text-sm text-gray-700'>
            <p className='font-semibold text-[#ff7a45]'>Latest Review</p>
            <p className='mt-1 line-clamp-3'>{latestReview.comment}</p>
          </div>
        )}

        <div className='flex items-center justify-between'>
          <span className='text-2xl font-black text-[var(--slate-black)]'>
            Rs. {data.price}
          </span>

          <div className='flex items-center gap-2 rounded-full bg-[var(--teal-tint)] p-1 shadow-inner'>
            <button className='flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--slate-black)] transition hover:bg-[#d8f5f2]' onClick={handleDecrease} type="button">
              <FaMinus size={12} />
            </button>
            <span className='min-w-[28px] text-center text-sm font-bold text-[var(--slate-black)]'>{quantity}</span>
            <button className='flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--slate-black)] transition hover:bg-[#d8f5f2]' onClick={handleIncrease} type="button">
              <FaPlus size={12} />
            </button>
          </div>
        </div>

        <button
          className={`${itemAlreadyInCart ? "bg-[var(--slate-black)]" : "bg-[var(--teal-dark)] hover:bg-[var(--teal-primary)]"} flex w-full items-center justify-center gap-3 rounded-[18px] px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition`}
          onClick={() => {
            if (quantity > 0) {
              dispatch(addToCart({
                id: data._id,
                name: data.name,
                price: data.price,
                image: data.image,
                shop: data.shop,
                quantity,
                foodType: data.foodType
              }))
            }
          }}
          type="button"
        >
          <FaShoppingCart size={16} />
          <span>{itemAlreadyInCart ? "Added To Cart" : "Add To Cart"}</span>
        </button>
      </div>
    </div>
  )
}

export default FoodCard
