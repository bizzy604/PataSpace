import { Logger, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
  globalPrefix: string,
) {
  const enabled = configService.get<boolean>('docs.enabled') ?? false;

  if (!enabled) {
    return null;
  }

  const docsPath = configService.get<string>('docs.path') ?? 'docs';
  const title = configService.get<string>('docs.title') ?? 'PataSpace API';
  const description =
    configService.get<string>('docs.description') ??
    'OpenAPI documentation for the PataSpace backend service.';
  const version = configService.get<string>('docs.version') ?? '0.1.0';
  const baseUrl = configService.get<string>('app.baseUrl') ?? 'http://localhost:3000';
  const normalizedPrefix = `/${globalPrefix}`.replace(/\/+/g, '/');

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(title)
      .setDescription(description)
      .setVersion(version)
      .addServer(normalizedPrefix, 'Current environment')
      .addBearerAuth(
        {
          bearerFormat: 'JWT',
          scheme: 'bearer',
          type: 'http',
        },
        'bearer',
      )
      .addTag('System', 'Operational health and readiness endpoints')
      .build(),
    {
      deepScanRoutes: true,
      ignoreGlobalPrefix: true,
    },
  );

  SwaggerModule.setup(docsPath, app, document, {
    customSiteTitle: `${title} Docs`,
    jsonDocumentUrl: `${docsPath}/openapi.json`,
    raw: ['json'],
    swaggerOptions: {
      displayRequestDuration: true,
      operationsSorter: 'alpha',
      persistAuthorization: false,
      tagsSorter: 'alpha',
    },
    useGlobalPrefix: true,
  });

  const docsUrl = `${baseUrl}${normalizedPrefix}/${docsPath}`.replace(/\/+/g, '/').replace(':/', '://');
  const jsonUrl = `${docsUrl}/openapi.json`;

  Logger.log(`Swagger UI available at ${docsUrl}`, 'Swagger');
  Logger.log(`OpenAPI JSON available at ${jsonUrl}`, 'Swagger');

  return {
    docsPath,
    docsUrl,
    jsonUrl,
  };
}
