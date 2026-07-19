import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../api/baseApi";
import { errorToastMiddleware } from "../api/errorToastMiddleware";
import authReducer from "../features/auth/authSlice";
import bookingWizardReducer from "../features/bookingWizard/wizardSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bookingWizard: bookingWizardReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware, errorToastMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
