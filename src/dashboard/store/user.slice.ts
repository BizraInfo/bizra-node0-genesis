import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiService from "../services/api.service";
import type {
  User,
  UserFilters,
  PaginatedResponse,
  UpdateUserRequest,
} from "../types/user.types";

interface UserState {
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const initialState: UserState = {
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  },
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  "user/fetchUsers",
  async (filters: UserFilters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });

      const response = await apiService.get<PaginatedResponse<User>>(
        `/users?${params.toString()}`,
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch users");
    }
  },
);

export const fetchUserById = createAsyncThunk(
  "user/fetchUserById",
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.get<User>(`/users/${userId}`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch user");
    }
  },
);

export const createUser = createAsyncThunk(
  "user/createUser",
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await apiService.post<User>("/users", userData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create user");
    }
  },
);

export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (
    { userId, data }: { userId: string; data: UpdateUserRequest },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.patch<User>(`/users/${userId}`, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update user");
    }
  },
);

export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      await apiService.delete(`/users/${userId}`);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete user");
    }
  },
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearUsers: (state) => {
      state.users = [];
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    // Fetch users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchUsers.fulfilled,
        (state, action: PayloadAction<PaginatedResponse<User>>) => {
          state.isLoading = false;
          state.users = action.payload.data;
          state.pagination = {
            total: action.payload.total,
            page: action.payload.page,
            limit: action.payload.limit,
            totalPages: action.payload.totalPages,
          };
        },
      )
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch user by ID
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchUserById.fulfilled,
        (state, action: PayloadAction<User>) => {
          state.isLoading = false;
          state.selectedUser = action.payload;
        },
      )
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create user
    builder
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.users.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update user
    builder
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete user
    builder
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.users = state.users.filter((u) => u.id !== action.payload);
        state.pagination.total -= 1;
        if (state.selectedUser?.id === action.payload) {
          state.selectedUser = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedUser, clearError, clearUsers } = userSlice.actions;
export default userSlice.reducer;
