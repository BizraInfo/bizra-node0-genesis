import { useMemo } from "react";
import { useAppSelector } from "../store/store";
import { UserRole } from "../types/user.types";

export const usePermissions = () => {
  const user = useAppSelector((state) => state.auth.user);

  const hasPermission = useMemo(
    () =>
      (permission: string): boolean => {
        if (!user) return false;
        return user.permissions.includes(permission);
      },
    [user],
  );

  const hasRole = useMemo(
    () =>
      (role: UserRole): boolean => {
        if (!user) return false;
        return user.role === role;
      },
    [user],
  );

  const hasAnyRole = useMemo(
    () =>
      (roles: UserRole[]): boolean => {
        if (!user) return false;
        return roles.includes(user.role);
      },
    [user],
  );

  const isAdmin = useMemo(() => {
    return user?.role === UserRole.ADMIN;
  }, [user]);

  const isModerator = useMemo(() => {
    return user?.role === UserRole.MODERATOR || isAdmin;
  }, [user, isAdmin]);

  const canCreateUser = useMemo(() => {
    return hasPermission("users:create") || isAdmin;
  }, [hasPermission, isAdmin]);

  const canUpdateUser = useMemo(() => {
    return hasPermission("users:update") || isModerator;
  }, [hasPermission, isModerator]);

  const canDeleteUser = useMemo(() => {
    return hasPermission("users:delete") || isAdmin;
  }, [hasPermission, isAdmin]);

  const canViewMetrics = useMemo(() => {
    return (
      hasPermission("metrics:view") ||
      hasAnyRole([UserRole.ADMIN, UserRole.MODERATOR])
    );
  }, [hasPermission, hasAnyRole]);

  const canManageSystem = useMemo(() => {
    return hasPermission("system:manage") || isAdmin;
  }, [hasPermission, isAdmin]);

  return {
    user,
    hasPermission,
    hasRole,
    hasAnyRole,
    isAdmin,
    isModerator,
    canCreateUser,
    canUpdateUser,
    canDeleteUser,
    canViewMetrics,
    canManageSystem,
  };
};

export default usePermissions;
