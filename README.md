# AI Chat Assistant (OpenRouter)

AI chat assistant for Obsidian with customizable prompts for any workflow. Supports ChatGPT, DeepSeek, Gemini, Claude, and 100+ other models.

![Custom Prompts](docs/Screenshot%202025-10-16%20at%2023.58.15.png)

![Menu with Custom Prompts](docs/Screenshot%202025-10-16%20at%2023.57.51.png)

## Features

- **Custom Prompts** - Create prompts for any use case: journaling, brainstorming, coaching, analysis, writing, learning
- **100+ AI Models** - Access GPT-4, Claude, Gemini, Llama and more via OpenRouter
- **Works in Your Notes** - Chat directly in any Obsidian note, responses saved automatically
- **Command Palette & Menu** - Each prompt becomes a command you can trigger from anywhere
- **60+ Languages** - Get responses in your preferred language
- **Desktop & Mobile** - Works everywhere Obsidian does
- **Private** - Conversations stored locally in your vault

### Start chatting in a note

![chat-gif](https://github.com/clairefro/obsidian-chat-cbt-plugin/assets/9841162/3b25b29e-ba86-4d39-b76f-fea17a75fe34)

### Summarize your findings when you're ready

![summary-gif](https://github.com/clairefro/obsidian-chat-cbt-plugin/assets/9841162/27130199-4398-4861-bef7-924bc9f979d2)

## Use Cases

Create custom prompts for whatever you need:

- **Journaling** - Reflect on your day, process emotions, track gratitude
- **Self-coaching** - Work through decisions, clarify goals, explore options
- **Writing** - Brainstorm ideas, get feedback, overcome blocks
- **Learning** - Explain concepts, quiz yourself, explore topics
- **Analysis** - Break down problems, examine assumptions, find blind spots
- **Creativity** - Generate ideas, explore "what if" scenarios, develop concepts

The plugin comes with default CBT (Cognitive Behavioral Therapy) prompts as examples, but you can replace or add to them with anything.

## Setup

AI Chat Assistant uses [OpenRouter](https://openrouter.ai/) to access AI models.

### Getting Started

1. **Create an OpenRouter account**
   - Go to [openrouter.ai](https://openrouter.ai/) and sign up
   - Add credits ($5-10 is plenty to start)

2. **Get your API key**
   - Navigate to [openrouter.ai/keys](https://openrouter.ai/keys)
   - Create a new key and copy it

3. **Configure the plugin**
   - Open Obsidian Settings → AI Chat Assistant
   - Paste your OpenRouter API key
   - Choose a model (default: `openai/gpt-4o-mini`)

### Choosing a Model

Browse models at [openrouter.ai/models](https://openrouter.ai/models)

| Model | ID | Cost | Notes |
|-------|-----|------|-------|
| GPT-4o Mini | `openai/gpt-4o-mini` | ~$0.001/session | Fast, cheap, good quality (default) |
| Claude 3.5 Sonnet | `anthropic/claude-3.5-sonnet` | ~$0.01/session | Best reasoning |
| Gemini Flash | `google/gemini-flash-1.5` | ~$0.001/session | Fast |
| Llama 3.1 70B | `meta-llama/llama-3.1-70b-instruct` | ~$0.003/session | Open source |

**Privacy Note:** Messages are sent to the model provider via OpenRouter. Review [OpenRouter's privacy policy](https://openrouter.ai/privacy).

## Usage

### Basic Chat

1. Write something in a note
2. Click the plugin icon → select "Chat" or a custom prompt
3. Continue the conversation by adding your responses at the bottom
4. Use "Summarize" when you want a summary table

### Custom Prompts

Create prompts for your specific needs:

1. Open Settings → AI Chat Assistant → Custom Prompts
2. Click "Add Prompt"
3. Enter a name (appears in menu and as a command)
4. Write your prompt
5. Reload the plugin to activate

**Examples:**

| Prompt Name | What It Does |
|-------------|--------------|
| Daily Reflection | "Help me reflect on my day. Ask about highlights, challenges, and what I learned." |
| Decision Helper | "Help me think through this decision. Ask clarifying questions and explore pros/cons." |
| Idea Brainstorm | "Help me brainstorm ideas about this topic. Build on my ideas and suggest new angles." |
| Explain Simply | "Explain this concept in simple terms. Use analogies and examples." |
| Devil's Advocate | "Challenge my thinking. Point out assumptions and potential flaws." |

### Running Commands

**Ribbon menu** - Click the AI Chat Assistant icon

**Command Palette** - `Cmd/Ctrl + P` → search for prompt name

## Configuration

### System Prompt

Customize how the AI responds in Settings → AI Chat Assistant → Edit System Prompt.

The default prompt is configured for CBT-style questioning, but you can change it to anything.

### Assistant Name

Change how responses are labeled in your notes (Settings → Assistant Name).

### Language

Select your preferred response language from 60+ options.

## Default Prompts

The plugin includes these CBT-based prompts as examples:

- **Exposure Ladder** - Create an anxiety hierarchy
- **Activity Plan** - Build a behavioral activation plan
- **Habit Builder** - Design habits using behavioral principles
- **Avoidance Check** - Identify avoidance patterns

These are just defaults - modify or replace them with prompts that fit your workflow.

## Contributing

Install in developer mode:

1. Enable Community Plugins in Obsidian
2. Navigate to your vault's `.obsidian/plugins` directory
3. `git clone git@github.com:shmlkv/obsidian-prompt-assistant.git`
4. `npm i && npm run dev`
5. Enable the plugin in Obsidian settings

## Disclaimer

This is an AI assistant tool. For the default CBT prompts: they are not a replacement for professional therapy. The creator is not liable for outcomes from using this tool.

> Fork of [obsidian-chat-cbt-plugin](https://github.com/clairefro/obsidian-chat-cbt-plugin) by Claire Froelich

Prompt sources: [chat](https://github.com/shmlkv/obsidian-prompt-assistant/blob/main/src/prompts/system.ts), [summarize](https://github.com/shmlkv/obsidian-prompt-assistant/blob/main/src/prompts/summary.ts)

Issues or feedback: [GitHub Issues](https://github.com/shmlkv/obsidian-prompt-assistant/issues)

