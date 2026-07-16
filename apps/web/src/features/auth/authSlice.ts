import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface PublicUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
  status: string;
}

interface AuthState {
  accessToken: string | null;
  user: PublicUser | null;
  // A hard page load (e.g. direct URL navigation, refresh) starts with no
  // in-memory accessToken even for an already-logged-in visitor, since the
  // access token is intentionally never persisted to storage — only the
  // httpOnly refresh cookie survives. Route guards must wait for the
  // silent-refresh bootstrap attempt to finish before deciding whether to
  // redirect to login, otherwise every reload/deep-link bounces a logged-in
  // user out.
  bootstrapped: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  bootstrapped: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken: string; user: PublicUser }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.user = null;
    },
    setBootstrapped: (state) => {
      state.bootstrapped = true;
    },
  },
});

export const { setCredentials, setAccessToken, clearAuth, setBootstrapped } = authSlice.actions;
export default authSlice.reducer;
