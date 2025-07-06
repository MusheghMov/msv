# Manga Script Visualizer (MSV)

A modern web application for writing manga scripts in a custom markup language and visualizing them as interactive dialogue bubbles on a visual canvas. Built with RedwoodJS SDK and powered by Cloudflare Workers.

## ✨ Features

### 📝 Script Editor

- **Custom Manga Script Language**: Write scripts using an intuitive hierarchical syntax
- **Real-time Validation**: Instant syntax error detection with line numbers
- **Syntax Help**: Built-in hover card with examples and documentation
- **Chapter & Scene Organization**: Structured storytelling with clear narrative divisions

### 🎨 Visual Canvas

- **Interactive Dialogue Bubbles**: Drag and drop dialogue elements with different visual styles
- **Multiple Dialogue Types**: Speech, thought, shout, whisper, and narrator bubbles
- **Real-time Synchronization**: Changes to bubble positions automatically update the script
- **Canvas Constraints**: Fixed manga page dimensions (935x1305) with boundary management
- **Pan & Zoom**: Navigate large canvases with smooth interactions

### 🔄 Bidirectional Sync

- **Script-to-Canvas**: Parse script text into positioned dialogue bubbles
- **Canvas-to-Script**: Update script coordinates when bubbles are moved
- **Live Updates**: See changes instantly in both editor and canvas

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Cloudflare account (for deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd msv

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:5173` to start creating manga scripts!

## 📖 Manga Script Language Reference

### Basic Structure

```
# Chapter 1: The Beginning
* Scene 1: A quiet morning: The protagonist wakes up in their small apartment.

Character: speech: Hello, world!
Character: thought: I wonder what today will bring...
Narrator: narrator: The sun streamed through the window.

* Scene 2: The encounter: An unexpected meeting changes everything.

Character: shout: Watch out!
OtherCharacter: whisper: Did you hear that?
```

### Syntax Elements

#### Chapters

```
# Chapter Name
```

- Use `#` to define a new chapter
- Chapter names should be descriptive

#### Scenes

```
* Scene Name: Description
```

- Use `*` to define a new scene
- Include a brief description after the colon

#### Dialogues

```
Character: type: [position] text
```

**Dialogue Types:**

- `speech` - Regular dialogue bubbles
- `thought` - Thought bubbles (cloud-like)
- `shout` - Emphasized/loud speech
- `whisper` - Subtle/quiet speech
- `narrator` - Narrative text boxes

**Optional Positioning:**

```
Character: speech: {100,200} Hello there!
```

- Use `{x,y}` coordinates to position bubbles
- Coordinates are relative to the canvas (0,0 is top-left)

#### Comments

```
// This is a comment and will be ignored
```

### Complete Example

```
# Chapter 1: The Morning Rush

* Scene 1: Wake up call: Sarah's alarm clock rings loudly.

// Sarah's bedroom - morning light
Sarah: thought: {150,100} Just five more minutes...
AlarmClock: shout: {300,80} BEEP BEEP BEEP!
Sarah: speech: {150,180} Okay, okay, I'm up!

* Scene 2: Kitchen chaos: Rushing to make breakfast.

Sarah: speech: {200,150} Where did I put the coffee?
Narrator: narrator: {400,50} The kitchen was a disaster zone.
Sarah: whisper: {200,250} This is going to be a long day...

// Phone rings
Mom: speech: {500,100} Sarah, don't forget about dinner tonight!
Sarah: thought: {200,300} Oh no, I completely forgot!
```

## 🛠️ Technology Stack

### Frontend

- **RedwoodJS SDK** - Modern full-stack framework
- **React 19** - With Server Components and Client Components
- **Tldraw** - Interactive drawing canvas
- **TailwindCSS 4.x** - Utility-first CSS framework
- **shadcn/ui** - Pre-built component library
- **TypeScript** - Full type safety
- **Jotai** - State management

### Backend

- **Cloudflare Workers** - Serverless compute platform
- **Prisma ORM** - Database abstraction
- **Cloudflare D1** - SQLite-compatible database
- **Durable Objects** - Session management

## 💻 Development

### Available Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build

# Code Quality
pnpm types            # TypeScript type checking
pnpm check            # Generate Prisma client + type check
pnpm generate         # Generate Prisma client + Wrangler types

# Database
pnpm migrate:dev      # Apply migrations locally
pnpm migrate:prd      # Apply migrations to production
pnpm migrate:new      # Create new migration
pnpm seed             # Run database seeding

# Deployment
pnpm release          # Full production deployment
```

### Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── manga/           # Manga-specific components
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components
│   ├── types/               # TypeScript definitions
│   └── utils/               # Utility functions
├── client.tsx               # Client-side entry point
├── worker.tsx              # Worker routing & app definition
└── db.ts                   # Database configuration
```

### Key Components

- **MangaScriptVisualizer** - Main application page
- **ScriptEditor** - Text editor with syntax highlighting
- **TldrawMangaCanvas** - Interactive canvas component
- **DialogueBubbleShapeUtil** - Custom shape implementation

## 🏗️ Architecture

### RedwoodJS SDK on Cloudflare Workers

This application uses the RedwoodJS SDK, which provides a modern full-stack framework running on Cloudflare Workers. Key architectural decisions:

- **Server Components by Default** - Optimal performance with selective client-side hydration
- **Worker-based Routing** - Defined in `src/worker.tsx` using `defineApp`, `route`, `render`
- **Edge Computing** - Runs close to users worldwide via Cloudflare's global network
- **Stateless Architecture** - Each request is independent and scalable

### Data Flow

1. **Script Parsing** - Custom parser converts script text to structured data
2. **Canvas Rendering** - Tldraw renders dialogue bubbles with custom shapes
3. **Position Sync** - Canvas interactions update script coordinates
4. **Real-time Updates** - Changes propagate instantly between editor and canvas

## 🚀 Deployment

### Cloudflare Workers Setup

1. **Create Cloudflare Account** - Sign up at [cloudflare.com](https://cloudflare.com)

2. **Configure Database** (optional):

   ```bash
   npx wrangler d1 create msv-database
   ```

3. **Update Configuration**:

   - Edit `wrangler.jsonc` and replace `__change_me__` placeholders
   - Add your database binding if using D1

4. **Deploy**:

   ```bash
   pnpm release
   ```

### Environment Variables

Set these in your Cloudflare Workers dashboard:

```bash
WEBAUTHN_APP_NAME=MSV  # For authentication features
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following the existing code style
4. **Run tests**: `pnpm types` to ensure TypeScript compliance
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Use TypeScript for all new code
- Follow the existing component patterns
- Add JSDoc comments for public APIs
- Ensure all components are properly typed
- Test your changes thoroughly

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page for existing problems
2. Create a new issue with detailed information
3. Include your environment details and steps to reproduce

---

**Made with ❤️ for manga creators worldwide**

