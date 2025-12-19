import {
	App,
	Component,
	Editor,
	MarkdownRenderer,
	MarkdownView,
	Menu,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from 'obsidian';
import { AI_PROVIDERS, OPENROUTER_DEFAULT_MODEL } from './constants';
import defaultSystemPrompt from './prompts/system';
import { Mode, PromptAssistant } from './util/chatcbt';
import { languages } from './util/languages';
import { buildAssistantMsg, convertTextToMsg } from './util/messages';
import { platformBasedSecrets } from './util/platformBasedSecrets';

/** Interfaces */
interface CustomPrompt {
	id: string;
	name: string;
	prompt: string;
}

interface PromptAssistantPluginSettings {
	openRouterApiKey: string;
	mode: AI_PROVIDERS;
	language: string;
	openRouterModel: string;
	assistantName: string;
	customPrompts: CustomPrompt[];
}

interface PromptAssistantResponseInput {
	isSummary: boolean;
	mode: Mode;
	customPrompt?: string;
}

interface LegacySettings {
	openAiApiKey?: string;
	deepseekApiKey?: string;
	openaiModel?: string;
	deepseekModel?: string;
	ollamaModel?: string;
}

interface ApiError {
	message?: string;
	status?: number;
}

/** Constants */
const DEFAULT_LANG = 'English';

const DEFAULT_CUSTOM_PROMPTS: CustomPrompt[] = [
	{
		id: 'exposure-ladder',
		name: 'Exposure Ladder',
		prompt: 'Help me create an exposure hierarchy for this fear/anxiety. List situations from least to most anxiety-provoking (0-10 scale), with specific, actionable steps I can practice.',
	},
	{
		id: 'behavioral-activation',
		name: 'Activity Plan',
		prompt: 'Help me create a behavioral activation plan. Suggest specific activities that align with my values and could improve my mood. Include small, achievable steps I can take today.',
	},
	{
		id: 'habit-building',
		name: 'Habit Builder',
		prompt: 'Help me build this new habit using behavioral principles. Suggest: 1) A clear trigger/cue, 2) The specific behavior, 3) An immediate reward, 4) How to track progress.',
	},
	{
		id: 'avoidance-check',
		name: 'Avoidance Check',
		prompt: 'Help me identify what I might be avoiding in this situation. What behaviors am I using to escape discomfort? What would facing this look like in small, manageable steps?',
	},
];

const DEFAULT_SETTINGS: PromptAssistantPluginSettings = {
	openRouterApiKey: '',
	mode: AI_PROVIDERS.OPENROUTER,
	language: DEFAULT_LANG,
	openRouterModel: '',
	assistantName: 'Assistant',
	customPrompts: [],
};

/** Initialize chat client */
const promptAssistant = new PromptAssistant();

export default class PromptAssistantPlugin extends Plugin {
	settings: PromptAssistantPluginSettings;

	async onload() {
		console.debug('[PromptAssistant] Loading plugin...');

		await this.loadSettings();
		console.debug('[PromptAssistant] Settings loaded. Mode:', this.settings.mode, 'Model:', this.settings.openRouterModel || 'default');

		this.addRibbonIcon('bot-message-square', 'AI chat assistant', (evt: MouseEvent) => {
			const menu = new Menu();

			menu.addItem((item) =>
				item
					.setTitle(`Chat`)
					.setIcon('message-circle')
					.onClick(async () => {
						try {
							await this.getPromptAssistantResponse({
								isSummary: false,
								mode: this.settings.mode,
							});
						} catch (e) {
							new Notice(e.message);
						}
					}),
			);

			menu.addItem((item) =>
				item
					.setTitle(`Summarize`)
					.setIcon('table')
					.onClick(async () => {
						await this.getPromptAssistantSummary();
					}),
			);

			// Add custom prompts to menu
			if (this.settings.customPrompts && this.settings.customPrompts.length > 0) {
				menu.addSeparator();
				this.settings.customPrompts.forEach((customPrompt) => {
					menu.addItem((item) =>
						item
							.setTitle(customPrompt.name)
							.setIcon('zap')
							.onClick(async () => {
								try {
									await this.getPromptAssistantResponse({
										isSummary: false,
										mode: this.settings.mode,
										customPrompt: customPrompt.prompt,
									});
								} catch (e) {
									new Notice(e.message);
								}
							}),
					);
				});
			}

			menu.showAtMouseEvent(evt);
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'chat',
			name: 'Chat',
			editorCallback: (_editor: Editor, _view: MarkdownView) => {
				void this.getPromptAssistantResponse({
					isSummary: false,
					mode: this.settings.mode as Mode,
				});
			},
		});

		this.addCommand({
			id: 'summarize',
			name: 'Summarize',
			editorCallback: (_editor: Editor, _view: MarkdownView) => {
				void this.getPromptAssistantSummary();
			},
		});

		// Add commands for custom prompts
		this.settings.customPrompts.forEach((customPrompt) => {
			this.addCommand({
				id: `custom-prompt-${customPrompt.id}`,
				name: customPrompt.name,
				editorCallback: (_editor: Editor, _view: MarkdownView) => {
					void this.getPromptAssistantResponse({
						isSummary: false,
						mode: this.settings.mode as Mode,
						customPrompt: customPrompt.prompt,
					});
				},
			});
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MySettingTab(this.app, this));
	}

	/** Run when plugin is disabled */
	onunload() {
		console.debug('unloading plugin');
	}

	async loadSettings() {
		const loadedData = await this.loadData() as (PromptAssistantPluginSettings & LegacySettings) | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

		// Migrate old settings to OpenRouter
		let needsSave = false;

		// Force mode to OpenRouter
		if (this.settings.mode !== AI_PROVIDERS.OPENROUTER) {
			this.settings.mode = AI_PROVIDERS.OPENROUTER;
			needsSave = true;
		}

		// Add default custom prompts if none exist
		if (!this.settings.customPrompts || this.settings.customPrompts.length === 0) {
			this.settings.customPrompts = [...DEFAULT_CUSTOM_PROMPTS];
			needsSave = true;
		}

		// Migrate old API keys to OpenRouter if present
		if (loadedData) {
			if ((loadedData.openAiApiKey || loadedData.deepseekApiKey) && !this.settings.openRouterApiKey) {
				// Use OpenAI key as default if present
				if (loadedData.openAiApiKey) {
					this.settings.openRouterApiKey = loadedData.openAiApiKey;
					needsSave = true;
				} else if (loadedData.deepseekApiKey) {
					this.settings.openRouterApiKey = loadedData.deepseekApiKey;
					needsSave = true;
				}
			}

			// Migrate model settings
			if ((loadedData.openaiModel || loadedData.deepseekModel || loadedData.ollamaModel) && !this.settings.openRouterModel) {
				if (loadedData.openaiModel) {
					// Convert OpenAI model to OpenRouter format
					this.settings.openRouterModel = loadedData.openaiModel.includes('/')
						? loadedData.openaiModel
						: `openai/${loadedData.openaiModel}`;
					needsSave = true;
				}
			}
		}

		if (needsSave) {
			await this.saveSettings();
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async getPromptAssistantResponse({ isSummary = false, customPrompt }: PromptAssistantResponseInput) {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			return;
		}

		if (!Object.values(AI_PROVIDERS).includes(this.settings.mode)) {
			new Notice(
				`Invalid mode '${this.settings.mode}' detected. Update in AI chat assistant plugin settings and select a valid mode`,
			);
			return;
		}

		if (
			this.settings.mode === AI_PROVIDERS.OPENROUTER &&
			!this.settings.openRouterApiKey
		) {
			new Notice('Missing OpenRouter API key - update in AI chat assistant plugin settings');
			return;
		}

		const existingText = await this.app.vault.read(activeFile);
		if (!existingText.trim()) {
			new Notice('First, write something in a note');
			return;
		}

		const messages = existingText
			.split(/---+/)
			.map((i) => i.trim())
			.map((i) => convertTextToMsg(i, this.settings.assistantName));

		// Add custom prompt as a user message if provided
		if (customPrompt) {
			messages.push({ role: 'user', content: customPrompt });
		}

		const selectedModel = this.getCurrentModel();

		const loadingModal = new MarkdownTextModel(
			this.app,
			`Processing...\n\n_mode: ${this.settings.mode}_\n\n_model: ${selectedModel}_`,
		);
		loadingModal.open();

		let response = '';

		try {
			const openRouterApiKey = this.settings.openRouterApiKey
				? platformBasedSecrets.decrypt(this.settings.openRouterApiKey)
				: '';

			const res = await promptAssistant.chat({
				openRouterApiKey,
				messages,
				isSummary,
				mode: this.settings.mode as Mode,
				model: selectedModel,
				language: this.settings.language,
				prompt: defaultSystemPrompt,
			});
			response = res;
		} catch (e: unknown) {
			console.error('AI chat assistant error:', e);

			let errorMsg = 'An error occurred while processing your request.';
			const error = e as ApiError;

			// Use the enhanced error message if available
			if (error.message) {
				errorMsg = error.message;
			} else if (error.status) {
				if (error.status === 401) {
					errorMsg = 'Invalid API key. Please check your OpenRouter API key in settings.';
				} else if (error.status === 404) {
					errorMsg = `Model '${selectedModel}' not found. Check the model name at https://openrouter.ai/models`;
				} else if (error.status >= 400 && error.status < 500) {
					errorMsg = `Unable to connect to OpenRouter.\n\nEnsure you have:\n- A valid OpenRouter API key\n- Credits in your OpenRouter account\n- The correct model name`;
				} else if (error.status >= 500) {
					errorMsg = 'OpenRouter service error. Please try again later.';
				}
			}

			new Notice(`AI chat assistant error: ${errorMsg}`, 10000);
		} finally {
			loadingModal.close();
		}

		if (response) {
			const MSG_PADDING = '\n\n';
			const appendMsg = isSummary
				? MSG_PADDING + response
				: buildAssistantMsg(response, this.settings.assistantName);
			await this.app.vault.append(activeFile, appendMsg);
		}
	}

	async getPromptAssistantSummary() {
		await this.getPromptAssistantResponse({
			isSummary: true,
			mode: this.settings.mode,
		});
	}

	private getCurrentModel(): string {
		return this.settings.openRouterModel || OPENROUTER_DEFAULT_MODEL;
	}
}

class MySettingTab extends PluginSettingTab {
	plugin: PromptAssistantPlugin;

	constructor(app: App, plugin: PromptAssistantPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('a', {
			href: 'https://github.com/shmlkv/obsidian-prompt-assistant/blob/main/README.md',
			text: 'Read the setup guide ↗️ ',
		});
		containerEl.createEl('br');
		containerEl.createEl('br');

		// ASSISTANT NAME
		new Setting(containerEl)
			.setName('Assistant name')
			.setDesc('Name that appears in responses (e.g., Assistant, Claude, GPT)')
			.addText((text) =>
				text
					.setPlaceholder('Assistant')
					.setValue(this.plugin.settings.assistantName)
					.onChange(async (value) => {
						this.plugin.settings.assistantName = value.trim() || 'Assistant';
						await this.plugin.saveSettings();
					}),
			);

		// OPENROUTER MODEL
		new Setting(containerEl)
			.setName('OpenRouter model')
			.setDesc('Enter model ID (e.g., openai/gpt-4o-mini, anthropic/claude-3.5-sonnet)')
			.addText((text) =>
				text
					.setPlaceholder(OPENROUTER_DEFAULT_MODEL)
					.setValue(this.plugin.settings.openRouterModel)
					.onChange(async (value) => {
						this.plugin.settings.openRouterModel = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		const modelsLinkEl = containerEl.createEl('a', {
			href: 'https://openrouter.ai/models',
			text: 'Browse available models',
		});
		modelsLinkEl.target = '_blank';
		modelsLinkEl.addClass('prompt-assistant-link');
		containerEl.createEl('br');
		containerEl.createEl('br');

		// OPENROUTER API KEY
		new Setting(containerEl)
			.setName('OpenRouter API key')
			.setDesc('Get your API key from OpenRouter')
			.addText((text) =>
				text
					.setPlaceholder('Enter your API key')
					.setValue(
						this.plugin.settings.openRouterApiKey
							? platformBasedSecrets.decrypt(this.plugin.settings.openRouterApiKey)
							: '',
					)
					.onChange(async (value) => {
						if (!value.trim()) {
							this.plugin.settings.openRouterApiKey = '';
						} else {
							this.plugin.settings.openRouterApiKey = platformBasedSecrets.encrypt(
								value.trim(),
							);
						}
						await this.plugin.saveSettings();
					}),
			);

		const apiKeyLinkEl = containerEl.createEl('a', {
			href: 'https://openrouter.ai/keys',
			text: 'Get OpenRouter API key',
		});
		apiKeyLinkEl.target = '_blank';
		apiKeyLinkEl.addClass('prompt-assistant-link');
		containerEl.createEl('br');
		containerEl.createEl('br');

		// CUSTOM PROMPTS SECTION
		new Setting(containerEl)
			.setName('Custom prompts')
			.setDesc('Create custom prompts with names. They will appear in the menu and as commands.')
			.setHeading();

		// Add new prompt button
		new Setting(containerEl)
			.setName('Add custom prompt')
			.setDesc('Create a new custom prompt')
			.addButton((button) =>
				button
					.setButtonText('Add prompt')
					.setCta()
					.onClick(async () => {
						const newPrompt: CustomPrompt = {
							id: Date.now().toString(),
							name: 'New Prompt',
							prompt: 'Enter your prompt here',
						};
						this.plugin.settings.customPrompts.push(newPrompt);
						await this.plugin.saveSettings();
						this.display(); // Refresh the settings view
						new Notice('Please reload the plugin for the new command to appear');
					}),
			);

		// Display existing custom prompts
		this.plugin.settings.customPrompts.forEach((customPrompt, index) => {
			// Prompt name and delete button
			new Setting(containerEl)
				.setName(`Prompt #${index + 1}`)
				.setDesc('Name')
				.addText((text) =>
					text
						.setPlaceholder('Prompt name')
						.setValue(customPrompt.name)
						.onChange(async (value) => {
							customPrompt.name = value || 'Unnamed Prompt';
							await this.plugin.saveSettings();
						}),
				)
				.addButton((button) =>
					button
						.setButtonText('Delete')
						.setWarning()
						.onClick(async () => {
							this.plugin.settings.customPrompts.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
							new Notice('Please reload the plugin for changes to take effect');
						}),
				);

			// Prompt textarea
			new Setting(containerEl)
				.setName('')
				.setDesc('Prompt text')
				.addTextArea((text) => {
					text
						.setPlaceholder('Enter the prompt text...')
						.setValue(customPrompt.prompt)
						.onChange(async (value) => {
							customPrompt.prompt = value;
							await this.plugin.saveSettings();
						});
					text.inputEl.rows = 3;
					text.inputEl.setCssStyles({ width: '100%' });
				});
		});

		// LANGUAGE
		new Setting(containerEl)
			.setName('Preferred language (beta)')
			.setDesc('For responses from the assistant')
			.addDropdown((dropdown) => {
				languages.forEach((lang) => {
					dropdown.addOption(lang.value, lang.label);
				});

				dropdown
					.setValue(this.plugin.settings.language || 'English')
					.onChange(async (value) => {
						this.plugin.settings.language = value;
						await this.plugin.saveSettings();
					});
			});

	}
}

class MarkdownTextModel extends Modal {
	text: string;
	component: Component;
	constructor(app: App, _text: string) {
		super(app);
		this.text = _text;
		this.component = new Component();
	}

	onOpen() {
		const { contentEl } = this;

		const markdownContainer = contentEl.createDiv('markdown-container');

		void MarkdownRenderer.render(
			this.app,
			this.text,
			markdownContainer,
			'',
			this.component,
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
