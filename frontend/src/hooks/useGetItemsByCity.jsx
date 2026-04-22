import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setItemsInMyCity } from '../redux/userSlice'

function useGetItemsByCity() {
    const dispatch=useDispatch()
    const {currentCity}=useSelector(state=>state.user)
  useEffect(()=>{
  const fetchItems=async () => {
    try {
           const allResult = await axios.get(`${serverUrl}/api/item/get-all`,{withCredentials:true})
           const allItems = Array.isArray(allResult.data) ? allResult.data : []

           if (currentCity) {
             const cityResult = await axios.get(`${serverUrl}/api/item/get-by-city/${currentCity}`,{withCredentials:true})
             const cityItems = Array.isArray(cityResult.data) ? cityResult.data : []
             const cityIds = new Set(cityItems.map((item) => String(item._id)))
             const remainingItems = allItems.filter((item) => !cityIds.has(String(item._id)))
             dispatch(setItemsInMyCity([...cityItems, ...remainingItems]))
             return
           }

           dispatch(setItemsInMyCity(allItems))
    } catch (error) {
        console.log(error)
    }
}
fetchItems()
 
  },[currentCity, dispatch])
}

export default useGetItemsByCity
