import { ExecutionContext } from '@nestjs/common';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard', () => {
  const createContext = (authorization?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization,
          },
        }),
      }),
    }) as unknown as ExecutionContext;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows requests without an authorization header', () => {
    const parentPrototype = Object.getPrototypeOf(OptionalJwtAuthGuard.prototype);
    const canActivateSpy = jest.spyOn(parentPrototype, 'canActivate');
    const guard = new OptionalJwtAuthGuard();

    expect(guard.canActivate(createContext())).toBe(true);
    expect(canActivateSpy).not.toHaveBeenCalled();
  });

  it('delegates to the passport guard when an authorization header is present', () => {
    const parentPrototype = Object.getPrototypeOf(OptionalJwtAuthGuard.prototype);
    const canActivateSpy = jest.spyOn(parentPrototype, 'canActivate').mockReturnValue(true);
    const guard = new OptionalJwtAuthGuard();

    expect(guard.canActivate(createContext('Bearer token'))).toBe(true);
    expect(canActivateSpy).toHaveBeenCalled();
  });
});
