import dotenv from "dotenv";
import os from "os";

export const getLocalIpAddress = (): string | null => {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    if (addresses) {
      for (const address of addresses) {
        if (address.family === "IPv4" && !address.internal) {
          return address.address;
        }
      }
    }
  }
  return null;
};

// Load environment variables from .env file
export const envVariables = dotenv.config();

if (envVariables.error) {
  console.error("❌ Error loading .env file:", envVariables.error);
} else {
  console.log("✅ Environment variables loaded successfully");
}
