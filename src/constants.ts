const CHAT_AGENT_MARKER = '**Prompt Assistant:**';
const CHAT_DELIMETER = '\n\n---\n\n';
const OPENROUTER_DEFAULT_MODEL = 'openai/gpt-4o-mini';

enum AI_PROVIDERS {
	OPENROUTER = 'openrouter',
}

export {
	CHAT_AGENT_MARKER,
	CHAT_DELIMETER,
	OPENROUTER_DEFAULT_MODEL,
	AI_PROVIDERS,
};
