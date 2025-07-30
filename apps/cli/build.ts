#!/usr/bin/env node
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function extractLicenses() {
  console.log('Extracting licenses...');
  try {
    const { stdout } = await execAsync(
      'npx license-checker --json --excludePrivatePackages --production',
      { cwd: __dirname },
    );

    const licenses = JSON.parse(stdout);
    const licenseText = ['# Third-Party Licenses\n'];

    for (const [pkg, info] of Object.entries(licenses)) {
      const licenseInfo = info as any;
      licenseText.push(`## ${pkg}`);
      licenseText.push(`- License: ${licenseInfo.licenses || 'Unknown'}`);
      if (licenseInfo.repository) {
        licenseText.push(`- Repository: ${licenseInfo.repository}`);
      }
      if (licenseInfo.publisher) {
        licenseText.push(`- Publisher: ${licenseInfo.publisher}`);
      }
      licenseText.push('');
    }

    await writeFile('dist/THIRD_PARTY_LICENSES.txt', licenseText.join('\n'));
    console.log('License information saved to dist/THIRD_PARTY_LICENSES.txt');
  } catch (error) {
    console.warn('Failed to extract licenses:', error);
  }
}

async function buildCLI() {
  try {
    // Ensure dist directory exists
    await mkdir('dist', { recursive: true });

    // Only keep external the packages that have issues with bundling
    const externalPackages: string[] = [];

    // Build the CLI bundling most dependencies
    const result = await build({
      entryPoints: [resolve(__dirname, 'src/index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: 'dist/index.cjs',
      banner: {
        js: `#!/usr/bin/env node
// This file bundles most dependencies. See THIRD_PARTY_LICENSES.txt for license information.

const import_meta_url = require('url').pathToFileURL(__filename).href;
`,
      },
      external: [
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
        ...externalPackages,
      ],
      // Define environment variables
      define: {
        'process.env.NODE_ENV': JSON.stringify(
          process.env.NODE_ENV || 'production',
        ),
        'import.meta.url': `import_meta_url`,
        'process.env.POSTHOG_API_KEY': JSON.stringify(
          process.env.POSTHOG_API_KEY,
        ),
        'process.env.POSTHOG_HOST': JSON.stringify(
          process.env.POSTHOG_HOST ?? null,
        ),
        'process.env.STAGEWISE_CONSOLE_URL': JSON.stringify(
          process.env.STAGEWISE_CONSOLE_URL ?? null,
        ),
        'process.env.API_URL': JSON.stringify(process.env.API_URL ?? null),
      },
      sourcemap: true,
      minify: process.env.NODE_ENV === 'production',
      // Handle packages that use require() internally
      mainFields: ['module', 'main'],
      conditions: ['module', 'import', 'default'],
      // Allow top-level await
      supported: {
        'top-level-await': true,
      },
      // Keep imports for better debugging
      keepNames: true,
      // Log metadata about the build
      metafile: true,
    });

    // Save build metadata for debugging
    await writeFile(
      'dist/build-meta.json',
      JSON.stringify(result.metafile, null, 2),
    );

    // Extract licenses after build
    await extractLicenses();

    // Run copy operations in parallel
    await Promise.all([
      // Copy toolbar dist to CLI dist
      copyToolbarDist(),

      // Copy bundled plugins to CLI dist
      copyBundledPlugins(),
    ]);

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

async function copyToolbarDist() {
  const toolbarDistPath = resolve(
    __dirname,
    '../../toolbar/core/dist/toolbar-main',
  );
  const targetPath = resolve(__dirname, 'dist/toolbar-app');

  // Check if toolbar dist exists
  if (!existsSync(toolbarDistPath)) {
    console.warn(
      'Toolbar dist not found. Make sure to build @stagewise/toolbar first.',
    );
    return;
  }

  // Create target directory
  await mkdir(targetPath, { recursive: true });

  // Copy toolbar dist contents
  await cp(toolbarDistPath, targetPath, { recursive: true });

  console.log('Copied toolbar dist to dist/toolbar-app');
}

async function copyBundledPlugins() {
  const bundledPlugins = ['react', 'angular', 'vue'];
  const pluginsTargetPath = resolve(__dirname, 'dist/plugins');

  // Create plugins directory
  await mkdir(pluginsTargetPath, { recursive: true });

  // Copy each bundled plugin
  for (const pluginName of bundledPlugins) {
    const pluginSourcePath = resolve(
      __dirname,
      `../../plugins/${pluginName}/dist`,
    );
    const pluginTargetPath = resolve(pluginsTargetPath, pluginName);

    // Check if plugin dist exists
    if (!existsSync(pluginSourcePath)) {
      console.warn(
        `Plugin ${pluginName} dist not found at ${pluginSourcePath}. Make sure to build @stagewise-plugins/${pluginName} first.`,
      );
      continue;
    }

    // Create target directory for this plugin
    await mkdir(pluginTargetPath, { recursive: true });

    // Copy plugin dist contents
    await cp(pluginSourcePath, pluginTargetPath, { recursive: true });

    console.log(`Copied ${pluginName} plugin to dist/plugins/${pluginName}`);
  }
}

buildCLI();
