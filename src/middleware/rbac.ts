// src/middleware/rbac.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Role-Based Access Control (RBAC) middleware
 * Validates user roles against required permissions for route access
 */

export enum Role {
  ADMIN = 'ADMIN',
  VENDOR = 'VENDOR',
  AFFILIATE = 'AFFILIATE',
  INFLUENCER = 'INFLUENCER',
  BUYER = 'BUYER'
}

// Role hierarchy - higher roles inherit permissions from lower ones
const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.BUYER]: 1,
  [Role.AFFILIATE]: 2,
  [Role.INFLUENCER]: 2,
  [Role.VENDOR]: 3,
  [Role.ADMIN]: 4
};

// Extended request interface to include user info from auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    role: Role;
    [key: string]: any;
  };
}

/**
 * Main RBAC middleware - allows access to users with specified roles
 * @param roles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 */
export const allow = (...roles: Role[] | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    
    // Check if user is authenticated (should be handled by auth middleware first)
    if (!authReq.user) {
      res.status(401).json({ 
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
      return;
    }

    const userRole = authReq.user.role;
    
    // Check if user role is in allowed roles
    const allowedRoles = roles as Role[];
    if (allowedRoles.includes(userRole)) {
      next();
      return;
    }

    // If not directly allowed, check if user has sufficient role hierarchy
    const userRoleLevel = ROLE_HIERARCHY[userRole];
    const hasPermission = allowedRoles.some(role => {
      const requiredLevel = ROLE_HIERARCHY[role as Role];
      return userRoleLevel >= requiredLevel;
    });

    if (hasPermission) {
      next();
      return;
    }

    res.status(403).json({
      message: 'Insufficient permissions',
      error: 'FORBIDDEN',
      required: roles,
      current: userRole
    });
  };
};

/**
 * Strict role check - only allows exact role matches (no hierarchy)
 * @param roles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 */
export const allowOnly = (...roles: Role[] | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      res.status(401).json({ 
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
      return;
    }

    const userRole = authReq.user.role;
    const allowedRoles = roles as Role[];
    
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        message: 'Insufficient permissions',
        error: 'FORBIDDEN',
        required: roles,
        current: userRole
      });
      return;
    }

    next();
  };
};

/**
 * Resource ownership check - ensures user can only access their own resources
 * @param resourceUserIdField - Field name in the resource that contains the user ID
 * @param requestParamName - Parameter name in request that contains the resource identifier
 * @returns Express middleware function
 */
export const allowOwner = (resourceUserIdField: string = 'userId', requestParamName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      res.status(401).json({ 
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
      return;
    }

    const userId = authReq.user.sub;
    const resourceId = req.params[requestParamName];
    
    // For POST requests, check in body
    if (req.method === 'POST' && req.body[resourceUserIdField]) {
      if (req.body[resourceUserIdField] !== userId) {
        res.status(403).json({
          message: 'Can only access your own resources',
          error: 'FORBIDDEN'
        });
        return;
      }
    }

    // Store for use in controllers if needed
    (req as any).resourceOwnership = {
      userId,
      resourceId,
      resourceUserIdField
    };

    next();
  };
};

/**
 * Combination middleware - allows role-based access OR resource ownership
 * @param roles - Array of roles that bypass ownership check
 * @param resourceUserIdField - Field name for ownership check
 * @param requestParamName - Parameter name for resource ID
 * @returns Express middleware function
 */
export const allowRoleOrOwner = (
  roles: Role[] | string[],
  resourceUserIdField: string = 'userId',
  requestParamName: string = 'id'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      res.status(401).json({ 
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
      return;
    }

    const userRole = authReq.user.role;
    const allowedRoles = roles as Role[];
    
    // Check if user has privileged role
    if (allowedRoles.includes(userRole)) {
      next();
      return;
    }

    // If not privileged role, check ownership
    const userId = authReq.user.sub;
    const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];
    
    if (resourceUserId && resourceUserId === userId) {
      next();
      return;
    }

    res.status(403).json({
      message: 'Insufficient permissions or not resource owner',
      error: 'FORBIDDEN'
    });
  };
};

/**
 * Check if user has any of the specified roles
 * @param user - User object with role property
 * @param roles - Roles to check against
 * @returns boolean indicating if user has required role
 */
export const hasRole = (user: { role: Role }, ...roles: Role[]): boolean => {
  return roles.includes(user.role);
};

/**
 * Check if user has sufficient role level in hierarchy
 * @param user - User object with role property
 * @param minRole - Minimum required role
 * @returns boolean indicating if user meets role requirement
 */
export const hasMinRole = (user: { role: Role }, minRole: Role): boolean => {
  const userLevel = ROLE_HIERARCHY[user.role];
  const requiredLevel = ROLE_HIERARCHY[minRole];
  return userLevel >= requiredLevel;
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = allow(Role.ADMIN);

/**
 * Middleware to check if user is vendor or admin
 */
export const requireVendorOrAdmin = allow(Role.VENDOR, Role.ADMIN);

/**
 * Middleware to check if user is affiliate or admin
 */
export const requireAffiliateOrAdmin = allow(Role.AFFILIATE, Role.ADMIN);

/**
 * Middleware to check if user is influencer or admin
 */
export const requireInfluencerOrAdmin = allow(Role.INFLUENCER, Role.ADMIN);

/**
 * Middleware that allows authenticated users of any role
 */
export const requireAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user) {
    res.status(401).json({ 
      message: 'Authentication required',
      error: 'UNAUTHORIZED'
    });
    return;
  }

  next();
};

export default {
  allow,
  allowOnly,
  allowOwner,
  allowRoleOrOwner,
  hasRole,
  hasMinRole,
  requireAdmin,
  requireVendorOrAdmin,
  requireAffiliateOrAdmin,
  requireInfluencerOrAdmin,
  requireAuthenticated,
  Role
};