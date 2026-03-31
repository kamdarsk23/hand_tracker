const PREFIX = '[HandTracker]'

const logger = {
  log: (...args) => console.log(PREFIX, ...args),
  info: (...args) => console.info(PREFIX, ...args),
  warn: (...args) => console.warn(PREFIX, ...args),
  error: (...args) => console.error(PREFIX, ...args),
}

export default logger
