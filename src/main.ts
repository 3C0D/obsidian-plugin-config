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

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload(): Promise<void> {
    console.log("loading plugin");
    await this.loadSettings();

    this.addCommand({
      id: 'show-confirmation-modal',
      name: 'Show Confirmation Modal (Local)',
      callback: () => this.showConfirmationModal()
    });

    this.addCommand({
      id: 'show-centralized-modal',
      name: 'Show Confirmation Modal (Centralized)',
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

    this.addSettingTab(new SampleSettingTab(this.app, this));
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

class SampleSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl);
  }
}

