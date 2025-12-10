import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./auth.slice";
import userReducer from "./user.slice";
import validationReducer from "./validation.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    validation: validationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["auth/login/fulfilled", "auth/register/fulfilled"],
        ignoredPaths: ["auth.user.createdAt", "auth.user.updatedAt"],
      },
    }),
  devTools: import.meta.env.VITE_APP_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Custom hooks with types
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
