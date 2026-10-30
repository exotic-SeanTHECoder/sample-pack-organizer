import fs from 'fs/promises';
import path from 'path';
import { parseFile } from 'music-metadata';
import fse from 'fs-extra';
import chalk from 'chalk';

const AUDIO_EXTENSIONS = new Set([
  '.wav', '.mp3', '.aiff', '.aif', '.flac', '.ogg', '.oga', '.m4a', '.aac', '.wma'
]);

const DEFAULT_CATEGORIES = [
  { name: 'Kicks', keywords: ['kick', 'bd', 'bassdrum', 'bass-drum'] },
  { name: 'Snares', keywords: ['snare', 'sd'] },
  { name: 'Claps', keywords: ['clap'] },
  { name: 'Hats', keywords: ['hat', 'hihat', 'hi-hat', 'hh', 'openhat', 'closedhat'] },
  { name: '808s', keywords: ['808'] },
  { name: 'Bass', keywords: ['bass', 'sub', 'reese'] },
  { name: 'Percussion', keywords: ['perc', 'tom', 'rim', 'shaker', 'cowbell', 'tamb', 'conga', 'bongo'] },
  { name: 'Melodies', keywords: ['melody', 'mel', 'lead', 'pluck', 'piano', 'keys', 'synth', 'arp'] },
  { name: 'Loops', keywords: ['loop', 'groove'] },
  { name: 'FX', keywords: ['fx', 'riser', 'impact', 'sweep', 'whoosh', 'downlifter', 'noise'] },
  { name: 'Vocals', keywords: ['vocal', 'vox', 'voice', 'chant', 'adlib'] },
  { name: 'Unsorted', keywords: [] }
];

async function loadCategories(configPath) {
  if (!configPath) return DEFAULT_CATEGORIES;
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    return config.categories || DEFAULT_CATEGORIES;
  } catch (err) {
    console.warn(chalk.yellow(`Warning: Could not load config ${configPath}, using defaults. ${err.message}`));
    return DEFAULT_CATEGORIES;
  }
}

async function* walkDirectory(dir, recursive) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && recursive) {
      yield* walkDirectory(fullPath, recursive);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (AUDIO_EXTENSIONS.has(ext)) {
        yield fullPath;
      }
    }
  }
}

async function getMetadata(filePath) {
  try {
    return await parseFile(filePath, { duration: true, skipCovers: true });
  } catch {
    return null;
  }
}

export async function organizeSamples(options) {
  const {
    source,
    dest: destOption,
    dryRun,
    copy,
    recursive,
    generateIndex,
    configPath
  } = options;

  const sourceAbs = path.resolve(source);
  const destAbs = path.resolve(destOption || path.join(sourceAbs, 'organized'));

  const categories = await loadCategories(configPath);
  const categoryList = categories;

  function classify(filename, metadata) {
    const lowerName = filename.toLowerCase();
    const searchText = [
      lowerName,
      (metadata?.common?.title || '').toLowerCase(),
      (metadata?.common?.comment?.[0] || '').toLowerCase(),
      (metadata?.common?.genre?.[0] || '').toLowerCase()
    ].join(' ');

    for (const category of categoryList) {
      for (const keyword of category.keywords || []) {
        if (searchText.includes(keyword.toLowerCase())) {
          return category.name;
        }
      }
    }
    return 'Unsorted';
  }

  console.log(chalk.cyan(`Scanning ${sourceAbs}...`));

  const index = [];
  let processed = 0;
  let moved = 0;

  for await (const filePath of walkDirectory(sourceAbs, recursive)) {
    processed++;
    const filename = path.basename(filePath);
    const metadata = await getMetadata(filePath);
    const category = classify(filename, metadata);

    const categoryDir = path.join(destAbs, category);
    const targetPath = path.join(categoryDir, filename);

    const entry = {
      originalPath: filePath,
      filename,
      category,
      targetPath,
      duration: metadata?.format?.duration || null,
      bitrate: metadata?.format?.bitrate || null,
      sampleRate: metadata?.format?.sampleRate || null,
      title: metadata?.common?.title || null,
      artist: metadata?.common?.artist || null
    };
    index.push(entry);

    if (dryRun) {
      console.log(chalk.gray(`[DRY] ${filename} → ${category}/`));
    } else {
      await fse.ensureDir(categoryDir);
      if (copy) {
        await fse.copy(filePath, targetPath, { overwrite: false });
        console.log(chalk.green(`Copied: ${filename} → ${category}/`));
      } else {
        // Avoid overwriting by renaming if exists
        let finalTarget = targetPath;
        let counter = 1;
        while (await fse.pathExists(finalTarget)) {
          const ext = path.extname(filename);
          const base = path.basename(filename, ext);
          finalTarget = path.join(categoryDir, `${base}_${counter}${ext}`);
          counter++;
        }
        await fse.move(filePath, finalTarget, { overwrite: false });
        entry.targetPath = finalTarget;
        console.log(chalk.green(`Moved: ${filename} → ${category}/`));
      }
      moved++;
    }
  }

  console.log(chalk.cyan(`\nProcessed ${processed} audio files.`));
  if (!dryRun) {
    console.log(chalk.cyan(`${copy ? 'Copied' : 'Moved'} ${moved} files to ${destAbs}`));
  }

  if (generateIndex) {
    const indexPath = path.join(destAbs, 'index.json');
    await fse.ensureDir(destAbs);
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
    console.log(chalk.blue(`Index written to ${indexPath}`));
  }

  // Summary by category
  const summary = {};
  for (const item of index) {
    summary[item.category] = (summary[item.category] || 0) + 1;
  }
  console.log(chalk.magenta('\nCategory summary:'));
  for (const [cat, count] of Object.entries(summary).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }
}
