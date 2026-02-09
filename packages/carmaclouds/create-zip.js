import { createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createZip(sourceDir, outputPath, name) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`✅ ${name}: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
      resolve();
    });

    archive.on('error', (err) => reject(err));
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Warning:', err);
      } else {
        reject(err);
      }
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

(async () => {
  console.log('📦 Creating distribution ZIP files with correct path separators...\n');

  await createZip(
    join(__dirname, 'dist'),
    join(__dirname, 'releases', 'carmaclouds-firefox.zip'),
    'Firefox'
  );

  await createZip(
    join(__dirname, 'dist-chrome'),
    join(__dirname, 'releases', 'carmaclouds-chrome.zip'),
    'Chrome'
  );

  await createZip(
    join(__dirname, 'foundry-module'),
    join(__dirname, 'releases', 'foundcloud-foundry-module.zip'),
    'Foundry Module'
  );

  console.log('\n✅ All ZIP files created successfully!');
})();
