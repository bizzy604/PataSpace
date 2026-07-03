/**
 * Purpose: Gate tests for call bridging: party resolution, telemetry, and the
 * hard rule that stale or unknown mappings never bridge (spec section 13).
 * Why important: bridging the wrong parties leaks numbers and calls; this is
 * the safety boundary of the masked contact layer.
 * Used by: jest unit lane (pnpm test:unit).
 */
import { encryptField } from '../../../common/security/encryption.util';
import { VoiceBridgeService } from './voice-bridge.service';

describe('VoiceBridgeService', () => {
  const encryptionKey = '12345678901234567890123456789012';
  const buyerPhone = '+254711000001';
  const posterPhone = '+254722000002';

  const createService = () => {
    const proxySessionService = {
      findRoutableSession: jest.fn(),
      recordInboundCall: jest.fn(),
    };
    const configService = {
      get: jest.fn().mockImplementation((key: string) =>
        key === 'security.encryptionKey' ? encryptionKey : undefined,
      ),
    };

    return {
      proxySessionService,
      service: new VoiceBridgeService(proxySessionService as never, configService as never),
    };
  };

  const createSession = () => ({
    id: 'session_1',
    firstPosterResponseAt: null,
    unlock: {
      buyer: {
        phoneNumberEncrypted: encryptField(buyerPhone, encryptionKey),
      },
      listing: {
        user: {
          phoneNumberEncrypted: encryptField(posterPhone, encryptionKey),
        },
      },
    },
  });

  it('bridges the seeker to the poster', async () => {
    const { proxySessionService, service } = createService();

    proxySessionService.findRoutableSession.mockResolvedValue(createSession());

    const response = await service.buildCallResponse(buyerPhone, '+254207000001');

    expect(response).toBe(`<Response><Dial phoneNumbers="${posterPhone}"/></Response>`);
    expect(proxySessionService.recordInboundCall).toHaveBeenCalledWith('session_1', false);
  });

  it('bridges the poster to the seeker and records response telemetry', async () => {
    const { proxySessionService, service } = createService();

    proxySessionService.findRoutableSession.mockResolvedValue(createSession());

    const response = await service.buildCallResponse(posterPhone, '+254207000001');

    expect(response).toBe(`<Response><Dial phoneNumbers="${buyerPhone}"/></Response>`);
    expect(proxySessionService.recordInboundCall).toHaveBeenCalledWith('session_1', true);
  });

  it('plays the closed prompt when no routable session exists', async () => {
    const { proxySessionService, service } = createService();

    proxySessionService.findRoutableSession.mockResolvedValue(null);

    const response = await service.buildCallResponse(buyerPhone, '+254207000001');

    expect(response).toContain('<Say>');
    expect(response).not.toContain('<Dial');
    expect(proxySessionService.recordInboundCall).not.toHaveBeenCalled();
  });

  it('never bridges an unknown caller', async () => {
    const { proxySessionService, service } = createService();

    proxySessionService.findRoutableSession.mockResolvedValue(createSession());

    const response = await service.buildCallResponse('+254733999999', '+254207000001');

    expect(response).toContain('<Say>');
    expect(response).not.toContain('<Dial');
    expect(proxySessionService.recordInboundCall).not.toHaveBeenCalled();
  });
});
