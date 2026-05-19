import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "./authTypes";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    hydrateAuth: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refreshToken");
        const user = localStorage.getItem("user");

        try {
          state.token = token;
          state.refreshToken = refreshToken;
          state.user = user ? JSON.parse(user) : null;
        } catch {
          state.token = null;
          state.refreshToken = null;
          state.user = null;
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
        }
      }

      state.hydrated = true;
    },

    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthUser;
        token: string;
        refreshToken: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.hydrated = true;

      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.hydrated = true;

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    },

    updateCurrentUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (!state.user) return;

      state.user = {
        ...state.user,
        ...action.payload,
      };

      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },
});

export const { hydrateAuth, setCredentials, logout, updateCurrentUser } =
  authSlice.actions;

export default authSlice.reducer;
