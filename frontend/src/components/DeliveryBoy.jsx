import React, { useEffect, useState } from 'react'
import Nav from './Nav'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { serverUrl } from '../App'
import DeliveryBoyTracking from './DeliveryBoyTracking'
import { ClipLoader } from 'react-spinners'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function DeliveryBoy() {
  const { userData, socket } = useSelector(state => state.user)
  const [currentOrder, setCurrentOrder] = useState()
  const [availableAssignments, setAvailableAssignments] = useState(null)
  const [todayDeliveries, setTodayDeliveries] = useState([])
  const [totalEarning, setTotalEarning] = useState(0)
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!socket || userData?.role !== "deliveryBoy") return

    let watchId
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const latitude = position.coords.latitude
          const longitude = position.coords.longitude
          setDeliveryBoyLocation({ lat: latitude, lon: longitude })
          socket.emit('updateLocation', {
            latitude,
            longitude,
            userId: userData._id
          })
        },
        (error) => {
          console.log(error)
        },
        {
          enableHighAccuracy: true
        }
      )
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId)
    }
  }, [socket, userData])

  const ratePerDelivery = 50
  const todayEarning = todayDeliveries.reduce((sum, delivery) => sum + delivery.count * ratePerDelivery, 0)

  const formatEstimatedTime = (dateString) => {
    if (!dateString) {
      return "Updating"
    }

    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getAssignments = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-assignments`, { withCredentials: true })
      setAvailableAssignments(Array.isArray(result.data) ? result.data : [])
    } catch (error) {
      console.log(error)
      setAvailableAssignments([])
    }
  }

  const getCurrentOrder = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-current-order`, { withCredentials: true })
      setCurrentOrder(result.data)
    } catch (error) {
      console.log(error)
      setCurrentOrder(null)
    }
  }

  const acceptOrder = async (assignmentId) => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/accept-order/${assignmentId}`, { withCredentials: true })
      console.log(result.data)
      await getCurrentOrder()
      await getAssignments()
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (!socket || userData?.role !== "deliveryBoy") {
      return
    }

    const handleNewAssignment = (data) => {
      setAvailableAssignments(prev => {
        const nextAssignments = [...(prev || [])]
        const alreadyExists = nextAssignments.some(item => item.assignmentId === data.assignmentId)
        if (!alreadyExists) {
          nextAssignments.push(data)
        }
        return nextAssignments
      })
      getAssignments()
    }

    socket.on('newAssignment', handleNewAssignment)
    return () => {
      socket.off('newAssignment', handleNewAssignment)
    }
  }, [socket, userData?.role])

  const completeDelivery = async () => {
    setLoading(true)
    setMessage("")
    try {
      const result = await axios.post(`${serverUrl}/api/order/complete-delivery`, {
        orderId: currentOrder._id,
        shopOrderId: currentOrder.shopOrder._id
      }, { withCredentials: true })
      setMessage(result.data.message)
      await getCurrentOrder()
      await getAssignments()
      await handleTodayDeliveries()
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const pickupOrder = async () => {
    setLoading(true)
    setMessage("")
    try {
      const result = await axios.post(`${serverUrl}/api/order/pickup-order`, {
        orderId: currentOrder._id,
        shopOrderId: currentOrder.shopOrder._id
      }, { withCredentials: true })
      setMessage(result.data.message)
      await getCurrentOrder()
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const handleTodayDeliveries = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-today-deliveries`, { withCredentials: true })
      console.log(result.data)
      setTodayDeliveries(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  const handleDeliveryEarnings = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-delivery-earnings`, { withCredentials: true })
      setTotalEarning(result.data?.totalEarning || 0)
    } catch (error) {
      console.log(error)
      setTotalEarning(0)
    }
  }

  useEffect(() => {
    if (userData?.role !== "deliveryBoy") {
      return
    }

    getAssignments()
    getCurrentOrder()
    handleTodayDeliveries()
    handleDeliveryEarnings()
  }, [userData?.role, userData?._id])

  useEffect(() => {
    if (userData?.role !== "deliveryBoy") {
      return
    }

    const intervalId = setInterval(() => {
      getAssignments()
      getCurrentOrder()
      handleDeliveryEarnings()
    }, 5000)

    return () => {
      clearInterval(intervalId)
    }
  }, [userData?.role, userData?._id])

  return (
    <div className='w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto'>
      <Nav />
      <div className='w-full max-w-[800px] flex flex-col gap-5 items-center'>
        <div className='bg-white rounded-2xl shadow-md p-5 flex flex-col justify-start items-center w-[90%] border border-orange-100 text-center gap-2'>
          <h1 className='text-xl font-bold text-[#ff4d2d]'>Welcome, {userData.fullName}</h1>
          <p className='text-[#ff4d2d] '><span className='font-semibold'>Latitude:</span> {deliveryBoyLocation?.lat}, <span className='font-semibold'>Longitude:</span> {deliveryBoyLocation?.lon}</p>
        </div>

        <div className='bg-white rounded-2xl shadow-md p-5 w-[90%] mb-6 border border-orange-100'>
          <h1 className='text-lg font-bold mb-3 text-[#ff4d2d] '>Today Deliveries</h1>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={todayDeliveries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => [value, "orders"]} labelFormatter={label => `${label}:00`} />
              <Bar dataKey="count" fill='#ff4d2d' />
            </BarChart>
          </ResponsiveContainer>

          <div className='max-w-sm mx-auto mt-6 p-6 bg-white rounded-2xl shadow-lg text-center'>
            <h1 className='text-xl font-semibold text-gray-800 mb-2'>Total Earning</h1>
            <span className='text-3xl font-bold text-green-600'>Rs. {totalEarning}</span>
            <p className='mt-2 text-xs text-gray-500'>Today: Rs. {todayEarning}</p>
          </div>
        </div>

        {!currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100'>
          <h1 className='text-lg font-bold mb-4 flex items-center gap-2'>Available Orders</h1>

          <div className='space-y-4'>
            {availableAssignments?.length > 0
              ?
              (
                availableAssignments.map((assignment, index) => (
                  <div className='border rounded-lg p-4 flex justify-between items-center' key={index}>
                    <div>
                      <p className='text-sm font-semibold'>{assignment?.shopName}</p>
                      <p className='text-sm text-gray-500'><span className='font-semibold'>Delivery Address:</span> {assignment?.deliveryAddress.text}</p>
                      <p className='text-xs text-gray-400'>{assignment.items.length} items | {assignment.subtotal}</p>
                    </div>
                    <button className='bg-orange-500 text-white px-4 py-1 rounded-lg text-sm hover:bg-orange-600' onClick={() => acceptOrder(assignment.assignmentId)}>Accept</button>
                  </div>
                ))
              ) : <p className='text-gray-400 text-sm'>No Available Orders</p>}
          </div>
        </div>}

        {currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100'>
          <h2 className='text-lg font-bold mb-3'>Current Order</h2>
          <div className='border rounded-lg p-4 mb-3'>
            <p className='font-semibold text-sm'>{currentOrder?.shopOrder.shop.name}</p>
            <p className='text-sm text-gray-500'>{currentOrder.deliveryAddress.text}</p>
            <p className='text-xs text-gray-400'>{currentOrder.shopOrder.shopOrderItems.length} items | {currentOrder.shopOrder.subtotal}</p>
            <p className='mt-2 text-xs text-gray-500'>Status: <span className='font-semibold text-gray-700'>{currentOrder.shopOrder.status}</span></p>
            <p className='text-xs text-gray-500'>Estimated delivery: <span className='font-semibold text-gray-700'>{currentOrder.shopOrder.estimatedDeliveryTime ? formatEstimatedTime(currentOrder.shopOrder.estimatedDeliveryTime) : "Updating"}</span></p>
          </div>

          <DeliveryBoyTracking data={{
            deliveryBoyLocation: deliveryBoyLocation || {
              lat: userData.location.coordinates[1],
              lon: userData.location.coordinates[0]
            },
            customerLocation: {
              lat: currentOrder.deliveryAddress.latitude,
              lon: currentOrder.deliveryAddress.longitude
            }
          }} />

          {message && <p className='text-center text-green-500 text-lg mt-4'>{message}</p>}

          {currentOrder.shopOrder.status === "out of delivery" ? (
            <button className='mt-4 w-full bg-orange-500 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:bg-orange-600 active:scale-95 transition-all duration-200' onClick={pickupOrder} disabled={loading}>
              {loading ? <ClipLoader size={20} color='white' /> : "Mark As Picked Up"}
            </button>
          ) : currentOrder.shopOrder.status === "picked up" ? (
            <button className='mt-4 w-full bg-green-500 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:bg-green-600 active:scale-95 transition-all duration-200' onClick={completeDelivery} disabled={loading}>
              {loading ? <ClipLoader size={20} color='white' /> : "Mark As Delivered"}
            </button>
          ) : null}
        </div>}
      </div>
    </div>
  )
}

export default DeliveryBoy
