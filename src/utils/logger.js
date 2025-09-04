import SumoLogger from "sumo-logger";

// Initialize SumoLogic logger
let sumoLogger;

if (process.env.SUMO_LOGIC_ENDPOINT) {
  sumoLogger = new SumoLogger({
    endpoint: process.env.SUMO_LOGIC_ENDPOINT,
    clientUrl:
      process.env.HOST_URL || `http://localhost:${process.env.PORT || 3001}`,
    sourceName: "essae-flows",
    sourceCategory: "gallabox-flow",
  });
} else {
  // fallback: log locally
  sumoLogger = console;
}

// -------- Logger Utility --------
const sendLog = (level, message, extra = {}) => {
  const log = { level, message, ...extra };
  sumoLogger.log(log);

  // Always mirror logs to console when SumoLogger is active
  if (sumoLogger !== console) {
    console.log(log);
  }
};

// -------- Exported Loggers --------
export const logInfo = (message, data = {}) => sendLog("info", message, data);

export const logWarn = (message, data = {}) => sendLog("warn", message, data);

export const logError = (message, error = null, data = {}) => {
  const log = {
    error: error
      ? {
          message: error.message,
          stack: error.stack,
          ...error,
        }
      : null,
    ...data,
  };
  sendLog("error", message, log);
};

export const logDebug = (message, data = {}) => sendLog("debug", message, data);
