export default {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => /^WIP(?::\s.+)?$/.test(message.trim())],
};
