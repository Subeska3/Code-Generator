# Local Coding Assistant

A lightweight, fully local web interface for interacting with Ollama language models (like Gemma). It provides a clean, fast chat experience customized for code generation and review. Your code never leaves your machine.

## Features
- **100% Local Processing:** Connects directly to your local Ollama instance (`http://localhost:11434`).
- **Code Optimized:** Includes syntax highlighting, one-click code block copying, and Markdown formatting via `marked.js`.
- **System Presets:** Quickly switch between tailored personas (General Coder, Python Expert, JS/TS, Code Reviewer, Shell/DevOps) via the sidebar.
- **Light/Dark Mode:** Built-in theme toggling that remembers your preference.
- **Math Support:** Renders mathematical formulas using KaTeX.
- **Streaming Responses:** See the AI's thoughts and responses in real-time as they are generated.

## Prerequisites
- **Ollama:** You must have [Ollama](https://ollama.com/) installed and running locally.
- **Models:** Pull at least one model. The app defaults to looking for `gemma4`, but you can select any installed model via the sidebar dropdown.
  ```bash
  ollama pull gemma:2b
  ```

## How to Run
Since this is a lightweight static site without a build step, you can run it simply by:
1. Opening the `index.html` file directly in any modern web browser.
2. Ensure Ollama is running in the background (`ollama serve`).

*(Optional)* You can also serve it via a local web server:
```bash
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

## Configuration
- To change the Ollama endpoint or port, click the **⚙ (Settings)** icon in the top right corner.
- You can switch between downloaded models using the Model dropdown in the left sidebar.
- Adjust the Temperature slider to control model creativity.

## Project Structure
- `index.html`: The main user interface and document structure.
- `style.css`: Contains all styling, themes, and UI animations.
- `script.js`: Handles Ollama API communication, streaming logic, and Markdown rendering.
