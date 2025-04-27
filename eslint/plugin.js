import baseConfig from './base.js';

// Add Obsidian-specific rules
const obsidianRules = {
  // Add any Obsidian-specific rules here
  "no-unused-vars": ["warn", { 
    "varsIgnorePattern": "MyPlugin|Plugin|PluginSettingTab|App|Modal|Notice|Setting" 
  }],
};

// Merge with base config
const pluginConfig = baseConfig.map(config => ({
  ...config,
  rules: {
    ...config.rules,
    ...obsidianRules,
  },
}));

export default pluginConfig;
