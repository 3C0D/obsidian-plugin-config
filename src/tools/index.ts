// Simple tools for testing
export function showTestMessage(): string {
	return '✅ CENTRALIZED TOOLS WORK! This comes from obsidian-plugin-config!';
}

export function getRandomEmoji(): string {
	const emojis = ['🚀', '🎉', '✨', '🔥', '💯', '⚡', '🎯', '🌟'];
	return emojis[Math.floor(Math.random() * emojis.length)];
}
