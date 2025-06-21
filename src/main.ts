import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  Notice
} from "obsidian";
import { showConfirmModal } from "./modals/GenericConfirmModal.ts";
// import { showTestMessage, getRandomEmoji } from "obsidian-plugin-config/tools";

interface MyPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: "default"
};

export default class ObsidianPluginConfigPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload(): Promise<void> {
    console.log("Loading obsidian-plugin-config plugin for testing NPM exports");
    await this.loadSettings();

    this.addCommand({
      id: 'show-confirmation-modal',
      name: 'Test Confirmation Modal (Local)',
      callback: () => this.showConfirmationModal()
    });

    this.addCommand({
      id: 'show-centralized-modal',
      name: 'Test Confirmation Modal (Centralized)',
      callback: () => this.showCentralizedModal()
    });

    this.addCommand({
      id: 'test-tools',
      name: 'Test Centralized Tools',
      callback: () => {
        // const message = showTestMessage();
        // const emoji = getRandomEmoji();
        new Notice(`🎯 Test centralized tools (commented for autonomous mode)`);
      }
    });

    this.addSettingTab(new PluginConfigSettingTab(this.app, this));
  }

  private showConfirmationModal(): void {
    showConfirmModal(this.app, {
      title: "Confirmation requise",
      message: "Êtes-vous sûr de vouloir effectuer cette action ? Cette action ne peut pas être annulée.",
      confirmText: "Confirmer",
      cancelText: "Annuler",
      onConfirm: () => {
        new Notice("Action confirmée !");
        console.log("Action confirmée par l'utilisateur");
      },
      onCancel: () => {
        new Notice("Action annulée.");
        console.log("Action annulée par l'utilisateur");
      }
    });
  }

  private showCentralizedModal(): void {
    showConfirmModal(this.app, {
      title: "Centralized Modal Test",
      message: "This modal comes from the centralized configuration! Pretty cool, right?",
      confirmText: "Awesome!",
      cancelText: "Not bad",
      onConfirm: () => {
        new Notice("Centralized modal confirmed! 🎉");
      },
      onCancel: () => {
        new Notice("Centralized modal cancelled 😢");
      }
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

class PluginConfigSettingTab extends PluginSettingTab {
  plugin: ObsidianPluginConfigPlugin;

  constructor(app: App, plugin: ObsidianPluginConfigPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Obsidian Plugin Config Settings' });
    containerEl.createEl('p', {
      text: 'This plugin is used for testing NPM exports and development of the obsidian-plugin-config system.'
    });

    new Setting(containerEl)
      .setName('Test Setting')
      .setDesc('A test setting for development purposes')
      .addText(text => text
        .setPlaceholder('Enter test value')
        .setValue(this.plugin.settings.mySetting)
        .onChange(async (value) => {
          this.plugin.settings.mySetting = value;
          await this.plugin.saveSettings();
        }));
  }
}

