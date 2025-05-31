import { Plugin } from 'obsidian';

export default class TestPlugin extends Plugin {
  async onload() {
    console.log('Test Plugin loaded');
  }

  onunload() {
    console.log('Test Plugin unloaded');
  }
}
