/** Using console.error to guarantee stderr output in logs */
const logger = {
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.error(`[WARN] ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    console.error(`[INFO] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    console.error(`[DEBUG] ${message}`, ...args);
  },
};

export default logger;
