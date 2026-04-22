import React from 'react'
import { useSelector } from 'react-redux'
import UserDashboard from '../components/UserDashboard'
import OwnerDashboard from '../components/OwnerDashboard'
import DeliveryBoy from '../components/DeliveryBoy'
import PublicLanding from '../components/PublicLanding'

function Home() {
  const { userData } = useSelector(state => state.user)

  if (!userData) {
    return <PublicLanding />
  }

  if (userData.role == "user") {
    return <UserDashboard />
  }

  if (userData.role == "owner") {
    return (
      <div className='w-[100vw] min-h-[100vh] pt-[100px] flex flex-col items-center bg-[var(--bg-soft)]'>
        <OwnerDashboard />
      </div>
    )
  }

  return (
    <div className='w-[100vw] min-h-[100vh] pt-[100px] flex flex-col items-center bg-[var(--bg-soft)]'>
      <DeliveryBoy />
    </div>
  )
}

export default Home
