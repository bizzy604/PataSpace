import { AppService } from './app.service';

describe('AppService', () => {
  it('returns a healthy response shape', () => {
    const service = new AppService(
      {
        get: (key: string) => {
          if (key === 'app.name') {
            return 'pataspace-api';
          }

          if (key === 'app.environment') {
            return 'test';
          }

          return undefined;
        },
      } as never,
      {
        $queryRawUnsafe: jest.fn(),
      } as never,
      {
        healthCheck: jest.fn(),
      } as never,
      {
        healthCheck: jest.fn(),
      } as never,
      {
        healthCheck: jest.fn(),
      } as never,
    );

    expect(service.getHealth()).toMatchObject({
      status: 'ok',
      service: 'pataspace-api',
      environment: 'test',
    });
  });
});
