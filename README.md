# Pazel

Pazel is an interactive puzzle game that combines AI-generated art with classic sliding puzzle mechanics. The app generates unique images from creative prompts and transforms them into engaging grid puzzles.

## Features

- 🎨 AI-powered image generation using Recraft AI
- 🤖 Creative prompt generation using GPT-4
- 🧩 4x4 sliding puzzle gameplay
- 📱 Responsive design for both desktop and mobile
- 🌓 Clean, modern UI using shadcn components

## Tech Stack

- Next.js 15
- Bun package manager
- Tailwind CSS
- shadcn/ui components
- OpenAI API
- Recraft AI API

## Getting Started

### Prerequisites

- Bun (latest version)
- OpenAI API key
- Recraft AI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pazel.git
cd pazel
```

2. Install dependencies:
```bash
bun install
```

3. Create a `.env.local` file in the root directory and add your API keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
RECRAFT_API_KEY=your_recraft_api_key_here
```

4. Start the development server:
```bash
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Play

1. Click "Main" to generate a new image
2. Wait for the AI to create a unique image based on a creative prompt
3. Click "Mulai Puzzle" to start the puzzle
4. Click on pieces adjacent to the empty space to move them
5. Try to reconstruct the original image
6. Click the skull icon ("Nyerah") if you want to see the original image again

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate-prompt/
│   │   └── generate-image/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   └── button.tsx
│   └── PuzzleGrid.tsx
└── lib/
    └── utils.ts
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [OpenAI](https://openai.com/)
- [Recraft AI](https://www.recraft.ai/)

## Contact

If you have any questions or feedback, please open an issue in the repository.
