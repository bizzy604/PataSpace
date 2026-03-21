import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  it('returns parsed values for valid input', () => {
    const pipe = new ZodValidationPipe(
      z.object({
        name: z.string().min(1),
      }),
    );

    expect(pipe.transform({ name: 'PataSpace' })).toEqual({ name: 'PataSpace' });
  });

  it('returns the standardized validation payload for invalid input', () => {
    const pipe = new ZodValidationPipe(
      z.object({
        name: z.string().min(3),
      }),
    );

    try {
      pipe.transform({ name: 'ok' });
      fail('Expected pipe to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          fieldErrors: {
            name: expect.any(Array),
          },
        },
      });
    }
  });
});
