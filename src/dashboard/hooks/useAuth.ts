import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/store";
import {
  login,
  register,
  logout as logoutAction,
  checkAuth,
} from "../store/auth.slice";
import type { LoginRequest, RegisterRequest } from "../types/user.types";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth,
  );

  const loginUser = useCallback(
    async (credentials: LoginRequest) => {
      const result = await dispatch(login(credentials));
      if (login.fulfilled.match(result)) {
        navigate("/dashboard");
        return true;
      }
      return false;
    },
    [dispatch, navigate],
  );

  const registerUser = useCallback(
    async (data: RegisterRequest) => {
      const result = await dispatch(register(data));
      if (register.fulfilled.match(result)) {
        navigate("/dashboard");
        return true;
      }
      return false;
    },
    [dispatch, navigate],
  );

  const logoutUser = useCallback(async () => {
    await dispatch(logoutAction());
    navigate("/login");
  }, [dispatch, navigate]);

  const verifyAuth = useCallback(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    verifyAuth,
  };
};

export default useAuth;
