import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AuthService } from "../services/auth.service";
import type {
  User,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
} from "../types/user.types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: AuthService.getCurrentUser(),
  isAuthenticated: AuthService.isAuthenticated(),
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Login failed");
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await AuthService.register(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Registration failed");
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  AuthService.logout();
});

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const token = await AuthService.refreshAccessToken();
      if (!token) {
        throw new Error("Failed to refresh token");
      }
      return token;
    } catch (error: any) {
      return rejectWithValue(error.message || "Token refresh failed");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      AuthService.setUser(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    checkAuth: (state) => {
      state.isAuthenticated = AuthService.isAuthenticated();
      if (!state.isAuthenticated) {
        state.user = null;
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          state.isLoading = false;
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.error = null;
        },
      )
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        register.fulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          state.isLoading = false;
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.error = null;
        },
      )
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    });

    // Refresh token
    builder
      .addCase(refreshToken.pending, (state) => {
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state) => {
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setUser, clearError, checkAuth } = authSlice.actions;
export default authSlice.reducer;
