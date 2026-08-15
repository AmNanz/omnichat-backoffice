import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { API_GLOBAL_PREFIX } from './config/api.config';
import { resolveAppEnv, resolveEnvFilePaths } from './config/env.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

function prefixSwaggerPaths(
  document: ReturnType<typeof SwaggerModule.createDocument>,
) {
  const prefix = `/${API_GLOBAL_PREFIX}`;
  document.paths = Object.fromEntries(
    Object.entries(document.paths).map(([path, value]) => [
      path.startsWith(prefix) ? path : `${prefix}${path}`,
      value,
    ]),
  );
  return document;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);

  app.useLogger(logger);
  logger.log(`Startup APP_ENV=${resolveAppEnv()}`, 'Bootstrap');
  logger.log(`Startup NODE_ENV=${process.env.NODE_ENV ?? '(not set)'}`, 'Bootstrap');
  logger.log(
    `Startup env files=${resolveEnvFilePaths().join(', ')}`,
    'Bootstrap',
  );

  app.use(helmet());
  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  app.enableCors({
    origin: corsOrigin
      ? corsOrigin.split(',').map((origin) => origin.trim())
      : true,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OmniChat Backoffice API')
    .setDescription('Backoffice management APIs for OmniChat')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = prefixSwaggerPaths(
    SwaggerModule.createDocument(app, swaggerConfig, {
      ignoreGlobalPrefix: true,
    }),
  );
  SwaggerModule.setup(`${API_GLOBAL_PREFIX}/docs`, app, document);

  const port = configService.get<number>('PORT') ?? 3100;
  await app.listen(port);
  logger.log(`Listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
