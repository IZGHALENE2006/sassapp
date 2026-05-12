const app = require("./app");
const connectDb = require("./config/db");
const env = require("./config/env");

const start = async () => {
  try {
    await connectDb();
    app.listen(env.port, () => {
      console.log(`API running on port ${env.port} in ${env.nodeEnv} mode`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

start();
