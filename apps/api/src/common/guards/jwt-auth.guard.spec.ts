import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const createContext = () =>
    ({
      getHandler: () => 'handler',
      getClass: () => class TestClass {},
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    }) as unknown as ExecutionContext;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows public routes without invoking the passport guard', () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string | symbol) => key === IS_PUBLIC_KEY),
    } as unknown as Reflector;
    const parentPrototype = Object.getPrototypeOf(JwtAuthGuard.prototype);
    const canActivateSpy = jest.spyOn(parentPrototype, 'canActivate');
    const guard = new JwtAuthGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
    expect(canActivateSpy).not.toHaveBeenCalled();
  });

  it('delegates private routes to the passport guard', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as Reflector;
    const parentPrototype = Object.getPrototypeOf(JwtAuthGuard.prototype);
    const canActivateSpy = jest.spyOn(parentPrototype, 'canActivate').mockReturnValue(true);
    const guard = new JwtAuthGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
    expect(canActivateSpy).toHaveBeenCalled();
  });

  it('returns the authenticated user when passport succeeds', () => {
    const guard = new JwtAuthGuard({ getAllAndOverride: jest.fn() } as never);

    expect(
      guard.handleRequest(null, { id: 'user_1' }, undefined, createContext()),
    ).toEqual({ id: 'user_1' });
  });

  it('throws a standardized unauthorized error when passport fails', () => {
    const guard = new JwtAuthGuard({ getAllAndOverride: jest.fn() } as never);

    expect(() =>
      guard.handleRequest(null, null, { message: 'jwt expired' }, createContext()),
    ).toThrow(UnauthorizedException);
  });
});
