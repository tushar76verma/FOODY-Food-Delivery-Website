import { createSlice } from "@reduxjs/toolkit";

const loadStoredCartState = () => {
  if (typeof window === "undefined") {
    return { cartItems: [], totalAmount: 0 }
  }

  try {
    const storedCart = window.localStorage.getItem("foody-cart")
    if (!storedCart) {
      return { cartItems: [], totalAmount: 0 }
    }

    const parsedCart = JSON.parse(storedCart)
    const cartItems = Array.isArray(parsedCart.cartItems) ? parsedCart.cartItems : []
    const totalAmount = Number(parsedCart.totalAmount) || cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)

    return { cartItems, totalAmount }
  } catch (error) {
    return { cartItems: [], totalAmount: 0 }
  }
}

const persistedCartState = loadStoredCartState()

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    currentCity: null,
    currentState: null,
    currentAddress: null,
    shopInMyCity: null,
    itemsInMyCity: null,
    cartItems: persistedCartState.cartItems,
    totalAmount: persistedCartState.totalAmount,
    myOrders: [],
    searchItems: null,
    socket: null
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload
    },
    setCurrentCity: (state, action) => {
      state.currentCity = action.payload
    },
    setCurrentState: (state, action) => {
      state.currentState = action.payload
    },
    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload
    },
    setShopsInMyCity: (state, action) => {
      state.shopInMyCity = action.payload
    },
    setItemsInMyCity: (state, action) => {
      state.itemsInMyCity = action.payload
    },
    updateItemReviewInLists: (state, action) => {
      const { itemId, review, rating } = action.payload

      const patchItem = (item) => {
        if (!item || item._id != itemId) {
          return item
        }

        const nextReviews = Array.isArray(item.reviews) ? [...item.reviews] : []
        const existingReviewIndex = nextReviews.findIndex((entry) => (
          String(entry.order) === String(review.order)
          && String(entry.shopOrderId) === String(review.shopOrderId)
        ))

        if (existingReviewIndex >= 0) {
          nextReviews[existingReviewIndex] = {
            ...nextReviews[existingReviewIndex],
            ...review
          }
        } else {
          nextReviews.push(review)
        }

        return {
          ...item,
          reviews: nextReviews,
          rating: rating || item.rating
        }
      }

      if (Array.isArray(state.itemsInMyCity)) {
        state.itemsInMyCity = state.itemsInMyCity.map(patchItem)
      }

      if (Array.isArray(state.searchItems)) {
        state.searchItems = state.searchItems.map(patchItem)
      }
    },
    setSocket: (state, action) => {
      state.socket = action.payload
    },
    addToCart: (state, action) => {
      const cartItem = action.payload
      const existingItem = state.cartItems.find(i => i.id == cartItem.id)
      if (existingItem) {
        existingItem.quantity += cartItem.quantity
      } else {
        state.cartItems.push(cartItem)
      }

      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

    },

    setTotalAmount: (state, action) => {
      state.totalAmount = action.payload
    }

    ,

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload
      const item = state.cartItems.find(i => i.id == id)
      if (item) {
        item.quantity = quantity
      }
      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    },

    removeCartItem: (state, action) => {
      state.cartItems = state.cartItems.filter(i => i.id !== action.payload)
      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    },

    clearCart: (state) => {
      state.cartItems = []
      state.totalAmount = 0
    },

    setMyOrders: (state, action) => {
      state.myOrders = action.payload
    },
    addMyOrder: (state, action) => {
      state.myOrders = [action.payload, ...state.myOrders]
    }

    ,
    patchShopOrder: (state, action) => {
      const { orderId, shopId, shopOrderId, patch } = action.payload
      const order = state.myOrders.find(o => o._id == orderId)
      if (!order) {
        return
      }

      if (Array.isArray(order.shopOrders)) {
        const shopOrder = order.shopOrders.find((so) => (
          (shopOrderId && so._id == shopOrderId) || (shopId && so.shop._id == shopId)
        ))
        if (shopOrder) {
          Object.assign(shopOrder, patch)
        }
        return
      }

      if (order.shopOrders && ((shopOrderId && order.shopOrders._id == shopOrderId) || (shopId && order.shopOrders.shop._id == shopId))) {
        Object.assign(order.shopOrders, patch)
      }
    },

    updateOrderStatus: (state, action) => {
      const { orderId, shopId, shopOrderId, status, assignedDeliveryBoy, estimatedDeliveryTime, cancelledAt } = action.payload
      userSlice.caseReducers.patchShopOrder(state, {
        payload: {
          orderId,
          shopId,
          shopOrderId,
          patch: {
            status,
            ...(assignedDeliveryBoy !== undefined ? { assignedDeliveryBoy } : {}),
            ...(estimatedDeliveryTime !== undefined ? { estimatedDeliveryTime } : {}),
            ...(cancelledAt !== undefined ? { cancelledAt } : {})
          }
        }
      })
    },

    updateRealtimeOrderStatus: (state, action) => {
      userSlice.caseReducers.updateOrderStatus(state, action)
    },

    setSearchItems: (state, action) => {
      state.searchItems = action.payload
    }
  }
})

export const { setUserData, setCurrentAddress, setCurrentCity, setCurrentState, setShopsInMyCity, setItemsInMyCity, updateItemReviewInLists, addToCart, updateQuantity, removeCartItem, clearCart, setMyOrders, addMyOrder, patchShopOrder, updateOrderStatus, setSearchItems, setTotalAmount, setSocket ,updateRealtimeOrderStatus} = userSlice.actions
export default userSlice.reducer
