import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice"
import ownerSlice from "./ownerSlice"
import mapSlice from "./mapSlice"
export const store=configureStore({
    reducer:{
        user:userSlice,
        owner:ownerSlice,
        map:mapSlice
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredPaths: ["user.socket"],
                ignoredActions: ["user/setSocket"]
            }
        })
})

if (typeof window !== "undefined") {
    store.subscribe(() => {
        const { cartItems, totalAmount } = store.getState().user
        window.localStorage.setItem("foody-cart", JSON.stringify({
            cartItems,
            totalAmount
        }))
    })
}
