import { context } from 'esbuild';
import { BitburnerPlugin } from 'esbuild-bitburner-plugin';
import chokidar from chokidar;
import fs from fs/promises;

/** @type import('esbuild-bitburner-plugin').PluginExtension*/
const oneWaySync = {
  setup() {
    console.log('Setting up Watcher');

  }, //Run once on plugin startup

  beforeConnect() { }, //Run once before the game connects
  afterConnect(remoteAPI) {
    let watcher = chokidar.watch(['./data', './config']);
    watcher.on('add', path => pushFile(remoteAPI, path));
    watcher.on('change', path => pushFile(remoteAPI, path)); //Run every time after the game (re)connects
  },
  beforeBuild() { }, //Run before every build process
  afterBuild(remoteAPI) { }, //Run after build, before results are uploaded into the game
};

async function pushFile(remoteAPI, path) {
  await fs.stat(path, (err, stat) => {
    if (err) {
      console.log(err);
      return;
    }
  });
  console.log(`Trying to push file ${path}`);
  
  let content = await fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
  }
  );
  return remoteAPI.pushFile({server: 'home', filename: path, content: content}).catch(err => { console.log(err); console.log(`${path} - ${content}`); });
}



const createContext = async () => await context({
  entryPoints: [
    'scripts/**/*.js',
    'scripts/**/*.jsx',
    'scripts/**/*.ts',
    'scripts/**/*.tsx',
  ],
  outbase: "./servers",
  outdir: "./build",
  plugins: [
    BitburnerPlugin({
      port: 12525,
      types: 'NetscriptDefinitions.d.ts',
      plugins: [oneWaySync],
      mirror: {
      },
      distribute: {
      }
    })
  ],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  logLevel: 'debug'
});

const ctx = await createContext();
ctx.watch();
