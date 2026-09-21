function log(level, message, meta) {
    const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
    if (meta !== undefined) {
        // eslint-disable-next-line no-console
        console[level === 'info' ? 'log' : level](prefix, message, meta);
    }
    else {
        // eslint-disable-next-line no-console
        console[level === 'info' ? 'log' : level](prefix, message);
    }
}
export const logger = {
    info: (message, meta) => log('info', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    error: (message, meta) => log('error', message, meta),
};
