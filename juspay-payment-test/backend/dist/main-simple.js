"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_simple_module_1 = require("./app-simple.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_simple_module_1.AppModule);
    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
    });
    app.setGlobalPrefix('api');
    const port = process.env.PORT || 8000;
    await app.listen(port);
    console.log(`🚀 Backend server running on: http://localhost:${port}`);
    console.log(`📊 API endpoints available at: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main-simple.js.map