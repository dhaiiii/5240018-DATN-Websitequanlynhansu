import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Permission } from './permission.enum';
import { PERMISSIONS_KEY } from './permission.decorator';

@Injectable()
export class PermissionGuard extends JwtAuthGuard implements CanActivate {
    constructor(private reflector: Reflector) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // First check JWT authentication
        const isAuthenticated = await super.canActivate(context);
        if (!isAuthenticated) {
            return false;
        }

        // Get required permissions from decorator
        const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        // If no permissions required, allow access
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        // Get user from request
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Get permission_level from JWT payload
        const userPermission = user.permission_level;

        // Define permission hierarchy: admin > manager > user
        const permissionHierarchy = {
            [Permission.Admin]: 3,
            [Permission.Manager]: 2,
            [Permission.User]: 1,
        };

        const userLevel = permissionHierarchy[userPermission] || 0;

        // Check if user has any of the required permissions
        // Admin can access everything, manager can access manager and user, user can only access user
        const hasPermission = requiredPermissions.some((required) => {
            const requiredLevel = permissionHierarchy[required];
            return userLevel >= requiredLevel;
        });

        if (!hasPermission) {
            throw new ForbiddenException(
                'You do not have sufficient permissions to access this resource',
            );
        }

        return true;
    }
}
