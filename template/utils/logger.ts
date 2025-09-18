import morgan from "morgan";

// Define custom token for request body (limited to prevent massive logs)
morgan.token("body", (req: any) => {
  if (req.body && Object.keys(req.body).length) {
    const sanitizedBody = { ...req.body };
    
    // Sanitize sensitive fields if they exist
    if (sanitizedBody.password) sanitizedBody.password = "[FILTERED]";
    if (sanitizedBody.token) sanitizedBody.token = "[FILTERED]";
    
    return JSON.stringify(sanitizedBody);
  }
  return "-";
});

// Define custom format that includes more details
const customFormat = (tokens: any, req: any, res: any) => {
  return [
    `[${new Date().toISOString()}]`,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, "content-length") || "-",
    `${tokens["response-time"](req, res)} ms`,
    `body: ${tokens.body(req, res)}`,
  ].join(" ");
};

// Export different logger configurations
export const devLogger = morgan("dev");
export const prodLogger = morgan("combined");
export const customLogger = morgan(customFormat);

// Export a configured logger based on environment
export const configureLogger = () => {
  if (process.env.NODE_ENV === "production") {
    return prodLogger;
  } else {
    // Log to console only with dev format
    return morgan("dev");
  }
}; 