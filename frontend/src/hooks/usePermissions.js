import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { hasPermission as hasPermissionForUser } from "../constants/permissions";

export default function usePermissions() {
  const { user } = useAuth();

  return useMemo(
    () => ({
      can: (action) => hasPermissionForUser(user, action),
      role: user?.role || null,
      permissions: Array.isArray(user?.permissions) ? user.permissions : []
    }),
    [user]
  );
}
