import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setShopsInMyCity } from '../redux/userSlice'

function useGetShopByCity() {
    const dispatch=useDispatch()
    const {currentCity}=useSelector(state=>state.user)
  useEffect(()=>{
  const fetchShops=async () => {
    try {
           const allResult = await axios.get(`${serverUrl}/api/shop/get-all`,{withCredentials:true})
           const allShops = Array.isArray(allResult.data) ? allResult.data : []

           if (currentCity) {
             const cityResult = await axios.get(`${serverUrl}/api/shop/get-by-city/${currentCity}`,{withCredentials:true})
             const cityShops = Array.isArray(cityResult.data) ? cityResult.data : []
             const cityIds = new Set(cityShops.map((shop) => String(shop._id)))
             const remainingShops = allShops.filter((shop) => !cityIds.has(String(shop._id)))
             dispatch(setShopsInMyCity([...cityShops, ...remainingShops]))
             return
           }

           dispatch(setShopsInMyCity(allShops))
    } catch (error) {
        console.log(error)
    }
}
fetchShops()
 
  },[currentCity, dispatch])
}

export default useGetShopByCity
