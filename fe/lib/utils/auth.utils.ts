export const getPermissionLevel = (): string => {
    if (typeof window === 'undefined') return 'user';
    return localStorage.getItem('permission_level') || 'user';
};

export const isAdmin = (): boolean => {
    return getPermissionLevel() === 'admin';
};

export const isManager = (): boolean => {
    const level = getPermissionLevel();
    return level === 'admin' || level === 'manager';
};

export const isUser = (): boolean => {
    return true; // Everyone who is logged in is at least a user
};

export const getUserRole = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('userRole');
};

export const hasPermission = (requiredPermission: 'admin' | 'manager' | 'user'): boolean => {
    const userPermission = getPermissionLevel();

    // Permission hierarchy: admin > manager > user
    const hierarchy = {
        admin: 3,
        manager: 2,
        user: 1,
    };

    const userLevel = hierarchy[userPermission as keyof typeof hierarchy] || 0;
    const requiredLevel = hierarchy[requiredPermission] || 0;

    return userLevel >= requiredLevel;
};
