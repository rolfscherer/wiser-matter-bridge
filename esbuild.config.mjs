import { build } from 'esbuild';

build({
  entryPoints: ['src/HomeServer.ts'],
  bundle: true,
  platform: 'node',
  conditions: ['esbuild'],
  external: ['@stoprocent/bleno', '@stoprocent/bluetooth-hci-socket'],
  sourcemap: true,
  minify: true,
  keepNames: true,
  outfile: 'build/bundle/wmb.cjs',
  tsconfig: 'tsconfig.prod.json',
}).catch(() => process.exit(1));
