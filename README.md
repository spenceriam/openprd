# OpenPRD

Generate developer-ready Product Requirements Documents (PRDs) optimized for AI coding agents like Cursor, Claude Code, and Warp.dev.

## Features

- **AI-Optimized PRDs**: Token-efficient markdown designed for agentic coding
- **BYOK (Bring Your Own Key)**: Supports OpenAI, DeepSeek, and OpenRouter APIs
- **Instant Generation**: Transform ideas into structured PRDs in seconds
- **AI Agent Ready**: Includes BMAD/EARS methodology and todo.md files
- **Secure**: API keys encrypted locally, no data stored on servers

## Quick Start

1. **Enter your product idea** - Describe what you want to build
2. **Configure AI provider** - Add your API key (OpenAI, DeepSeek, or OpenRouter)
3. **Generate PRD** - Get a comprehensive, developer-ready document
4. **Copy & Build** - Use with any AI coding assistant

## Supported Providers

- **OpenAI** (GPT-4o, GPT-4o-mini, GPT-4-turbo)
- **DeepSeek** (deepseek-chat, deepseek-coder)
- **OpenRouter** (Access to 100+ models)

## Generated Output

Each PRD includes:
- Executive Summary & Problem Statement
- Solution Overview & Detailed Features
- Data Model & User Flows
- Technical Architecture & MVP Scope
- Implementation Notes for AI agents
- Ready-to-use `todo.md` with BMAD methodology

## Perfect For

- **Agentic Coding Projects** - Structured specs for AI assistants
- **Vibe Coding Sessions** - Quick PRDs to start building
- **Solo Developers** - Professional documentation without overhead
- **Rapid Prototyping** - Ideas to implementation-ready specs

## Tech Stack

- **Backend**: Encore.ts with SQLite
- **Frontend**: React + TypeScript + Tailwind CSS
- **Security**: AES-256-GCM encryption for API keys

## Development

```bash
# Start the application
encore run

# The frontend will be available at http://localhost:4000
```

## Acknowledgements

Huge love to [www.chatprd.com](https://www.chatprd.com) - this project is inspired by their excellent work. OpenPRD is not meant to replace CharPRD but rather provide a DIY, bring-your-own-key alternative for developers who want more control over their AI providers and costs.

## License

MIT License - feel free to fork, modify, and use for your projects.
