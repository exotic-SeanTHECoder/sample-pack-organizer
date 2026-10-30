# Sample Pack Organizer

A simple, fast CLI tool that scans messy downloads or sample folders and automatically sorts audio files into organized folders based on filename conventions and metadata tags.

Perfect for music producers who end up with chaotic folders full of kicks, snares, 808s, melodies, and FX.

## Features

- Scans directories (recursively by default) for common audio formats: WAV, MP3, AIFF, FLAC, OGG, M4A, etc.
- Classifies samples using filename keywords and tags (title, comment, genre)
- Creates clean folders: `Kicks/`, `Snares/`, `Hats/`, `808s/`, `Melodies/`, `Loops/`, `FX/`, `Percussion/`, `Vocals/`, `Bass/`, `Unsorted/`
- Move or copy mode
- Dry-run to preview changes
- Generates a detailed `index.json` with metadata
- Configurable categories via JSON
- Handles name collisions safely

## Installation

```bash
# Clone the repo
git clone https://github.com/exotic-SeanTHECoder/sample-pack-organizer.git
cd sample-pack-organizer

# Install dependencies
npm install

# Optional: link globally
npm link
```

## Usage

```bash
# Basic: move samples from a folder into organized subfolders
sample-organizer ~/Downloads/Samples

# Dry run (preview only)
sample-organizer ~/Downloads/Samples --dry-run

# Copy instead of move, and generate index
sample-organizer ./messy-pack --copy --index

# Custom destination
sample-organizer ./source --dest ./clean-library --index

# Use custom categories
sample-organizer ./source -c ./my-categories.json
```

### Options

| Option | Description |
|--------|-------------|
| `<source>` | Source directory (required) |
| `-d, --dest <dir>` | Destination directory (default: `<source>/organized`) |
| `--dry-run` | Preview without changing files |
| `--copy` | Copy files instead of moving |
| `--no-recursive` | Only scan top-level directory |
| `--index` | Write `index.json` with file details |
| `-c, --config <file>` | Custom categories JSON |

## Example

**Before:**
```
messy/
  kick_hard.wav
  snare_crack.wav
  808_sub_c.wav
  melody_loop_120.wav
  random_fx.wav
```

**After:**
```
messy/organized/
  Kicks/kick_hard.wav
  Snares/snare_crack.wav
  808s/808_sub_c.wav
  Melodies/melody_loop_120.wav
  FX/random_fx.wav
  index.json
```

## Custom Categories

Copy `config.example.json` and edit the keywords. Categories are matched in order (first match wins).

## Contributing

Issues and PRs welcome. This is a clean, focused tool aimed at producers who want their sample library organized without a heavy GUI.

## License

MIT
