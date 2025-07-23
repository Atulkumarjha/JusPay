import { NestFactory } from '@nestjs/core';
import { AppModule } from './app-simple.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend communication
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // Set global prefix for API
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 8000;
  await app.listen(port);
  
  console.log(`🚀 Backend server running on: http://localhost:${port}`);
  console.log(`📊 API endpoints available at: http://localhost:${port}/api`);
}
bootstrap();
