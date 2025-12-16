const CHAT_AGENT_MARKER = '**AI Chat Assistant:**';
const CHAT_DELIMETER = '\n\n---\n\n';
const OPENROUTER_DEFAULT_MODEL = 'openai/gpt-4o-mini';

enum AI_PROVIDERS {
	OPENROUTER = 'openrouter',
}

export {
	AI_PROVIDERS, CHAT_AGENT_MARKER,
	CHAT_DELIMETER,
	OPENROUTER_DEFAULT_MODEL
};
