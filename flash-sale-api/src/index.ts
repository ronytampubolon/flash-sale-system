import app from "./app";
import { appConfig } from "./config/app";
import { disconnectRedis } from "./config/redis";

app.listen(appConfig.port, () => {
  console.log(`Server running at http://localhost:${appConfig.port}`);
});
// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await disconnectRedis();
  process.exit(0);
});
