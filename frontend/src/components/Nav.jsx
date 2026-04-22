import React, { useEffect, useState } from 'react'
import { FaLocationDot } from "react-icons/fa6";
import { IoIosSearch } from "react-icons/io";
import { FiShoppingCart } from "react-icons/fi";
import { useDispatch, useSelector } from 'react-redux';
import { RxCross2 } from "react-icons/rx";
import axios from 'axios';
import { serverUrl } from '../App';
import { setSearchItems, setUserData } from '../redux/userSlice';
import { FaPlus } from "react-icons/fa6";
import { TbReceipt2 } from "react-icons/tb";
import { useNavigate } from 'react-router-dom';

function Nav() {
    const { userData, currentCity, cartItems, searchItems, itemsInMyCity } = useSelector(state => state.user)
    const { myShopData } = useSelector(state => state.owner)
    const [showInfo, setShowInfo] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [query, setQuery] = useState("")
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const locationLabel = currentCity?.trim() ? currentCity : "Set location"
    const showDesktopSearchDropdown = userData.role === "user" && query.trim() && !showSearch
    const showMobileSearchDropdown = userData.role === "user" && query.trim() && showSearch

    const handleLogOut = async () => {
        try {
            await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true })
            dispatch(setUserData(null))
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        const getLocalMatches = (rawQuery) => {
            const normalizedQuery = rawQuery.trim().toLowerCase()
            if (!normalizedQuery) {
                return []
            }
            return (itemsInMyCity || []).filter((item) => {
                const itemName = item?.name?.toLowerCase() || ""
                const itemCategory = item?.category?.toLowerCase() || ""
                const itemFoodType = item?.foodType?.toLowerCase() || ""
                const shopName = (typeof item?.shop === "object" ? item?.shop?.name : "")?.toLowerCase() || ""
                return (
                    itemName.includes(normalizedQuery) ||
                    itemCategory.includes(normalizedQuery) ||
                    itemFoodType.includes(normalizedQuery) ||
                    shopName.includes(normalizedQuery)
                )
            })
        }

        const fetchSearchItems = async () => {
            try {
                const params = new URLSearchParams({ query: query.trim() })
                if (currentCity) {
                    params.append("city", currentCity)
                }
                const result = await axios.get(`${serverUrl}/api/item/search-items?${params.toString()}`, { withCredentials: true })
                const apiItems = Array.isArray(result.data) ? result.data : []
                if (apiItems.length > 0) {
                    dispatch(setSearchItems(apiItems))
                    return
                }
                dispatch(setSearchItems(getLocalMatches(query)))
            } catch (error) {
                console.log(error)
                dispatch(setSearchItems(getLocalMatches(query)))
            }
        }

        if (query.trim()) {
            fetchSearchItems()
        } else {
            dispatch(setSearchItems(null))
        }
    }, [currentCity, dispatch, itemsInMyCity, query])

    return (
        <div className='w-full h-[80px] flex items-center justify-between md:justify-center gap-[30px] px-[20px] fixed top-0 z-[9999] bg-[var(--bg-soft)] overflow-visible'>
            {showSearch && userData.role == "user" && <div className='w-[90%] h-[70px] bg-white shadow-xl rounded-lg items-center gap-[20px] flex fixed top-[80px] left-[5%] md:hidden'>
                <div className='flex items-center w-[30%] overflow-hidden gap-[10px] px-[10px] border-r-[2px] border-gray-300'>
                    <FaLocationDot size={25} className="text-[var(--teal-primary)]" />
                    <div className='w-[80%] truncate text-gray-600'>{locationLabel}</div>
                </div>
                <div className='w-[80%] flex items-center gap-[10px]'>
                    <IoIosSearch size={25} className='text-[var(--teal-primary)]' />
                    <input type="text" placeholder='search delicious food...' className='px-[10px] text-gray-700 outline-0 w-full' onChange={(e) => setQuery(e.target.value)} value={query} />
                </div>
            </div>}

            <h1 className='text-3xl font-bold mb-2 text-[var(--teal-dark)]'>Foody</h1>
            {userData.role == "user" && <div className='md:w-[60%] lg:w-[40%] h-[70px] bg-white shadow-xl rounded-lg items-center gap-[20px] hidden md:flex'>
                <div className='flex items-center w-[30%] overflow-hidden gap-[10px] px-[10px] border-r-[2px] border-gray-300'>
                    <FaLocationDot size={25} className="text-[var(--teal-primary)]" />
                    <div className='w-[80%] truncate text-gray-600'>{locationLabel}</div>
                </div>
                <div className='w-[80%] flex items-center gap-[10px]'>
                    <IoIosSearch size={25} className='text-[var(--teal-primary)]' />
                    <input type="text" placeholder='search delicious food...' className='px-[10px] text-gray-700 outline-0 w-full' onChange={(e) => setQuery(e.target.value)} value={query} />
                </div>
            </div>}

            <div className='flex items-center gap-4'>
                {userData.role == "user" && (showSearch ? <RxCross2 size={25} className='text-[var(--teal-primary)] md:hidden' onClick={() => setShowSearch(false)} /> : <IoIosSearch size={25} className='text-[var(--teal-primary)] md:hidden' onClick={() => setShowSearch(true)} />)}

                {userData.role == "owner" ? <>
                    {myShopData && <>
                        <button className='hidden md:flex items-center gap-1 p-2 cursor-pointer rounded-full bg-[var(--teal-tint)] text-[var(--teal-dark)]' onClick={() => navigate("/add-item")}>
                            <FaPlus size={20} />
                            <span>Add Food Item</span>
                        </button>
                        <button className='md:hidden flex items-center p-2 cursor-pointer rounded-full bg-[var(--teal-tint)] text-[var(--teal-dark)]' onClick={() => navigate("/add-item")}>
                            <FaPlus size={20} />
                        </button>
                    </>}

                    <div className='hidden md:flex items-center gap-2 cursor-pointer relative px-3 py-1 rounded-lg bg-[var(--teal-tint)] text-[var(--teal-dark)] font-medium' onClick={() => navigate("/my-orders")}>
                        <TbReceipt2 size={20} />
                        <span>My Orders</span>
                    </div>
                    <div className='md:hidden flex items-center gap-2 cursor-pointer relative px-3 py-1 rounded-lg bg-[var(--teal-tint)] text-[var(--teal-dark)] font-medium' onClick={() => navigate("/my-orders")}>
                        <TbReceipt2 size={20} />
                    </div>
                </> : (
                    <>
                        {userData.role == "user" && <div className='relative cursor-pointer' onClick={() => navigate("/cart")}>
                            <FiShoppingCart size={25} className='text-[var(--teal-primary)]' />
                            <span className='absolute right-[-9px] top-[-12px] text-[var(--teal-primary)]'>{cartItems.length}</span>
                        </div>}

                        <button className='hidden md:block px-3 py-1 rounded-lg bg-[var(--teal-tint)] text-[var(--teal-dark)] text-sm font-medium' onClick={() => navigate("/my-orders")}>
                            My Orders
                        </button>
                    </>
                )}

                <div className='w-[40px] h-[40px] rounded-full flex items-center justify-center bg-[var(--teal-dark)] text-white text-[18px] shadow-xl font-semibold cursor-pointer' onClick={() => setShowInfo(prev => !prev)}>
                    {userData?.fullName.slice(0, 1)}
                </div>

                {showInfo && <div className={`fixed top-[80px] right-[10px] ${userData.role == "deliveryBoy" ? "md:right-[20%] lg:right-[40%]" : "md:right-[10%] lg:right-[25%]"} w-[180px] bg-white shadow-2xl rounded-xl p-[20px] flex flex-col gap-[10px] z-[9999]`}>
                    <div className='text-[17px] font-semibold'>{userData.fullName}</div>
                    {userData.role == "user" && <div className='md:hidden text-[var(--teal-dark)] font-semibold cursor-pointer' onClick={() => navigate("/my-orders")}>My Orders</div>}
                    <div className='text-[var(--teal-dark)] font-semibold cursor-pointer' onClick={handleLogOut}>Log Out</div>
                </div>}
            </div>

            {showDesktopSearchDropdown && (
                <div className='hidden md:block fixed top-[84px] left-1/2 -translate-x-1/2 md:w-[60%] lg:w-[40%] max-h-[360px] overflow-y-auto rounded-xl bg-white shadow-2xl border border-gray-100 p-3 z-[9999]'>
                    {Array.isArray(searchItems) && searchItems.length > 0 ? (
                        <div className='flex flex-col gap-2'>
                            {searchItems.map((item) => (
                                <button key={item._id} className='w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--teal-tint)] text-left' onClick={() => navigate(`/shop/${item?.shop?._id}`)} type="button">
                                    <img src={item.image} alt={item.name} className='w-14 h-14 rounded-lg object-cover' />
                                    <div className='min-w-0'>
                                        <p className='font-semibold text-[var(--slate-black)] truncate'>{item.name}</p>
                                        <p className='text-sm text-gray-500 truncate'>{item.category} • {item?.shop?.name}</p>
                                        <p className='text-sm font-bold text-[var(--teal-dark)]'>Rs. {item.price}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className='text-sm text-gray-500 text-center py-3'>No matching food found</p>
                    )}
                </div>
            )}

            {showMobileSearchDropdown && (
                <div className='md:hidden fixed top-[156px] left-[5%] w-[90%] max-h-[360px] overflow-y-auto rounded-xl bg-white shadow-2xl border border-gray-100 p-3 z-[9999]'>
                    {Array.isArray(searchItems) && searchItems.length > 0 ? (
                        <div className='flex flex-col gap-2'>
                            {searchItems.map((item) => (
                                <button key={item._id} className='w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--teal-tint)] text-left' onClick={() => navigate(`/shop/${item?.shop?._id}`)} type="button">
                                    <img src={item.image} alt={item.name} className='w-14 h-14 rounded-lg object-cover' />
                                    <div className='min-w-0'>
                                        <p className='font-semibold text-[var(--slate-black)] truncate'>{item.name}</p>
                                        <p className='text-sm text-gray-500 truncate'>{item.category} • {item?.shop?.name}</p>
                                        <p className='text-sm font-bold text-[var(--teal-dark)]'>Rs. {item.price}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className='text-sm text-gray-500 text-center py-3'>No matching food found</p>
                    )}
                </div>
            )}
        </div>
    )
}

export default Nav
