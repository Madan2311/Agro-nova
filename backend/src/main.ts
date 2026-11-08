import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const isProd = config.get('NODE_ENV') === 'production';

  app.use(helmet({ contentSecurityPolicy: isProd }));

  app.enableCors({
    origin: config.get<string>('CORS_ORIGINS', 'localhost:4200').split(','),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  configureApp(app);

  app.setGlobalPrefix('api');

  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('API de Productos')
      .setDescription('CRUD de productos protegido con JWT')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  await app.listen(config.get<number>('PORT', 3000));
}
bootstrap();
