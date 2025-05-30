import { Setting } from "obsidian";

/**
 * Helper for creating common setting types with consistent styling
 */
export class SettingsHelper {
    
    /**
     * Create a text input setting
     */
    static createTextSetting(
        containerEl: HTMLElement,
        name: string,
        desc: string,
        value: string,
        onChange: (value: string) => void,
        placeholder?: string
    ): Setting {
        return new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addText(text => text
                .setPlaceholder(placeholder || "")
                .setValue(value)
                .onChange(onChange)
            );
    }

    /**
     * Create a toggle setting
     */
    static createToggleSetting(
        containerEl: HTMLElement,
        name: string,
        desc: string,
        value: boolean,
        onChange: (value: boolean) => void
    ): Setting {
        return new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addToggle(toggle => toggle
                .setValue(value)
                .onChange(onChange)
            );
    }

    /**
     * Create a dropdown setting
     */
    static createDropdownSetting(
        containerEl: HTMLElement,
        name: string,
        desc: string,
        options: Record<string, string>,
        value: string,
        onChange: (value: string) => void
    ): Setting {
        return new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addDropdown(dropdown => {
                Object.entries(options).forEach(([key, label]) => {
                    dropdown.addOption(key, label);
                });
                dropdown
                    .setValue(value)
                    .onChange(onChange);
            });
    }

    /**
     * Create a number input setting
     */
    static createNumberSetting(
        containerEl: HTMLElement,
        name: string,
        desc: string,
        value: number,
        onChange: (value: number) => void,
        min?: number,
        max?: number,
        step?: number
    ): Setting {
        return new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addText(text => {
                text.inputEl.type = "number";
                if (min !== undefined) text.inputEl.min = min.toString();
                if (max !== undefined) text.inputEl.max = max.toString();
                if (step !== undefined) text.inputEl.step = step.toString();
                
                text
                    .setValue(value.toString())
                    .onChange(val => {
                        const num = parseFloat(val);
                        if (!isNaN(num)) onChange(num);
                    });
            });
    }

    /**
     * Create a button setting
     */
    static createButtonSetting(
        containerEl: HTMLElement,
        name: string,
        desc: string,
        buttonText: string,
        onClick: () => void
    ): Setting {
        return new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addButton(button => button
                .setButtonText(buttonText)
                .onClick(onClick)
            );
    }

    /**
     * Create a section header
     */
    static createHeader(
        containerEl: HTMLElement,
        title: string,
        description?: string
    ): void {
        const headerEl = containerEl.createEl("h3", { text: title });
        headerEl.style.marginTop = "20px";
        headerEl.style.marginBottom = "10px";
        headerEl.style.borderBottom = "1px solid var(--background-modifier-border)";
        headerEl.style.paddingBottom = "5px";
        
        if (description) {
            const descEl = containerEl.createEl("p", { text: description });
            descEl.style.marginTop = "0";
            descEl.style.marginBottom = "15px";
            descEl.style.color = "var(--text-muted)";
            descEl.style.fontSize = "0.9em";
        }
    }

    /**
     * Create a collapsible section
     */
    static createCollapsibleSection(
        containerEl: HTMLElement,
        title: string,
        isOpen: boolean = false
    ): { container: HTMLElement; toggle: () => void } {
        const sectionEl = containerEl.createDiv("setting-item");
        const headerEl = sectionEl.createDiv("setting-item-info");
        const nameEl = headerEl.createDiv("setting-item-name");
        nameEl.setText(title);
        nameEl.style.cursor = "pointer";
        nameEl.style.userSelect = "none";
        
        const contentEl = containerEl.createDiv("collapsible-content");
        contentEl.style.display = isOpen ? "block" : "none";
        contentEl.style.marginLeft = "20px";
        contentEl.style.marginTop = "10px";
        
        const arrow = nameEl.createSpan("collapse-icon");
        arrow.setText(isOpen ? "▼" : "▶");
        arrow.style.marginRight = "8px";
        arrow.style.fontSize = "0.8em";
        
        const toggle = () => {
            const isCurrentlyOpen = contentEl.style.display !== "none";
            contentEl.style.display = isCurrentlyOpen ? "none" : "block";
            arrow.setText(isCurrentlyOpen ? "▶" : "▼");
        };
        
        nameEl.addEventListener("click", toggle);
        
        return { container: contentEl, toggle };
    }
}
