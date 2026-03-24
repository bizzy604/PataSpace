import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const createContext = (user?: { id: string; role: Role }) =>
    ({
      getHandler: () => 'handler',
      getClass: () => class TestClass {},
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    }) as unknown as ExecutionContext;

  it('allows public routes without checking roles', () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string | symbol) => key === IS_PUBLIC_KEY),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('throws when a protected role route has no authenticated user', () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string | symbol) => {
        if (key === IS_PUBLIC_KEY) {
          return false;
        }

        if (key === ROLES_KEY) {
          return [Role.ADMIN];
        }

        return undefined;
      }),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(createContext())).toThrow(UnauthorizedException);
  });

  it('throws when the authenticated user lacks a required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string | symbol) => {
        if (key === IS_PUBLIC_KEY) {
          return false;
        }

        if (key === ROLES_KEY) {
          return [Role.ADMIN];
        }

        return undefined;
      }),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() =>
      guard.canActivate(createContext({ id: 'user_1', role: Role.USER })),
    ).toThrow(ForbiddenException);
  });

  it('allows users with the required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string | symbol) => {
        if (key === IS_PUBLIC_KEY) {
          return false;
        }

        if (key === ROLES_KEY) {
          return [Role.ADMIN];
        }

        return undefined;
      }),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext({ id: 'admin_1', role: Role.ADMIN }))).toBe(true);
  });
});
