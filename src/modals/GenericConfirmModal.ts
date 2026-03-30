import type { App } from 'obsidian';
import { Modal } from 'obsidian';

export interface ConfirmModalOptions {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel?: () => void;
}

export class GenericConfirmModal extends Modal {
	private options: ConfirmModalOptions;

	constructor(app: App, options: ConfirmModalOptions) {
		super(app);
		this.options = options;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		const title =
			this.options.title.charAt(0).toUpperCase() + this.options.title.slice(1);
		contentEl.createEl('h2', { text: title });

		// Message
		contentEl.createEl('p', { text: this.options.message });

		// Buttons container
		const buttonContainer = contentEl.createDiv('modal-button-container');

		// Cancel button
		const cancelBtn = buttonContainer.createEl('button', {
			text: this.options.cancelText || 'Cancel',
			cls: 'mod-cta'
		});
		cancelBtn.addEventListener('click', () => {
			this.options.onCancel?.();
			this.close();
		});

		// Confirm button
		const confirmBtn = buttonContainer.createEl('button', {
			text: this.options.confirmText || 'Confirm',
			cls: 'mod-cta mod-warning'
		});
		confirmBtn.addEventListener('click', () => {
			this.options.onConfirm();
			this.close();
		});

		// Focus on confirm button
		confirmBtn.focus();
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// Utility function for quick usage
export function showConfirmModal(app: App, options: ConfirmModalOptions): void {
	new GenericConfirmModal(app, options).open();
}

export async function confirmation(app: App, message: string): Promise<boolean> {
	return new Promise((resolve) => {
		new GenericConfirmModal(app, {
			title: 'Confirm',
			message,
			onConfirm: () => resolve(true),
			onCancel: () => resolve(false)
		}).open();
	});
}
