import { Notice } from "obsidian";

/**
 * Enhanced Notice helper with different types and durations
 */
export class NoticeHelper {
    private static readonly DEFAULT_DURATION = 5000;
    private static readonly SUCCESS_DURATION = 3000;
    private static readonly ERROR_DURATION = 8000;
    private static readonly WARNING_DURATION = 6000;

    /**
     * Show a success notice with green styling
     */
    static success(message: string, duration?: number): Notice {
        const notice = new Notice(
            `✅ ${message}`,
            duration ?? this.SUCCESS_DURATION
        );
        return notice;
    }

    /**
     * Show an error notice with red styling
     */
    static error(message: string, duration?: number): Notice {
        const notice = new Notice(
            `❌ ${message}`,
            duration ?? this.ERROR_DURATION
        );
        return notice;
    }

    /**
     * Show a warning notice with yellow styling
     */
    static warning(message: string, duration?: number): Notice {
        const notice = new Notice(
            `⚠️ ${message}`,
            duration ?? this.WARNING_DURATION
        );
        return notice;
    }

    /**
     * Show an info notice with blue styling
     */
    static info(message: string, duration?: number): Notice {
        const notice = new Notice(
            `ℹ️ ${message}`,
            duration ?? this.DEFAULT_DURATION
        );
        return notice;
    }

    /**
     * Show a loading notice that can be updated
     */
    static loading(message: string): Notice {
        return new Notice(`⏳ ${message}`, 0); // 0 = permanent until manually hidden
    }

    /**
     * Update a loading notice to success and auto-hide
     */
    static updateToSuccess(notice: Notice, message: string): void {
        notice.setMessage(`✅ ${message}`);
        setTimeout(() => notice.hide(), this.SUCCESS_DURATION);
    }

    /**
     * Update a loading notice to error and auto-hide
     */
    static updateToError(notice: Notice, message: string): void {
        notice.setMessage(`❌ ${message}`);
        setTimeout(() => notice.hide(), this.ERROR_DURATION);
    }

    /**
     * Show a notice with custom emoji and duration
     */
    static custom(emoji: string, message: string, duration?: number): Notice {
        return new Notice(
            `${emoji} ${message}`,
            duration ?? this.DEFAULT_DURATION
        );
    }

    /**
     * Show a progress notice for long operations
     */
    static progress(message: string, current: number, total: number): Notice {
        const percentage = Math.round((current / total) * 100);
        const progressBar = "█".repeat(Math.floor(percentage / 5)) + 
                           "░".repeat(20 - Math.floor(percentage / 5));
        
        return new Notice(
            `🔄 ${message}\n[${progressBar}] ${percentage}%`,
            0
        );
    }
}
