import { Plugin } from 'obsidian';

export default class TestPluginV2 extends Plugin {
  async onload() {
    console.log('Test Plugin V2 loaded');
  }

  onunload() {
    console.log('Test Plugin V2 unloaded');
  }
}
