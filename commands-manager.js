// @ts-check

"use strict";

const { readdir } = require("node:fs/promises");
const path = require("node:path");
const { Collection } = require("discord.js");

const slashCommandsPath = path.join(__dirname, "commands/slash");
const messageCommandsPath = path.join(__dirname, "commands/message");

const moduleDispose = Symbol("module.dispose");
exports.moduleDispose = moduleDispose;

/** @type {Collection<string, import("./type.js").SlashCommand>} */
const slashCommands = new Collection();
exports.slashCommands = slashCommands;

/** @type {Collection<string, import("./type.js").MessageCommand>} */
const messageCommands = new Collection();
exports.messageCommands = messageCommands;

/**
 * @type {import("./type.js").reloadAnyTypeCommandsFunctionType}
 */
async function reloadAnyTypeCommands(commandDirPaths, commandsCollection) {
    commandsCollection.clear();
    const filenames = await readdir(commandDirPaths);
    const commandFilePaths = filenames
        .filter(fname => fname.endsWith(".js"))
        .map(fname => path.join(commandDirPaths, fname));
    for (const filePath of commandFilePaths) {
        console.log("Load module:", filePath);
        const command = require(filePath);
        commandsCollection.set(command.data.name, command);
    }
}

async function reloadCommands() {
    const cwd = process.cwd();
    const nodeModules = path.join(process.cwd(), "node_modules");
    for (const name of Object.keys(require.cache)) {
        if (!name.startsWith(cwd)) continue;
        if (name.startsWith(nodeModules)) continue;
        if (name === path.join(process.cwd(), "commands-manager.js")) continue;
        const mod = /** @type {NodeModule} */ (require.cache[name]);
        const moduleDisposeCallback = mod.exports[moduleDispose];
        if (typeof moduleDisposeCallback === "function") moduleDisposeCallback();
        console.log(`[ DELETE CACHE ] ${name}`);
        delete require.cache[name];
    }
    await Promise.all([
        reloadAnyTypeCommands(slashCommandsPath, slashCommands),
        reloadAnyTypeCommands(messageCommandsPath, messageCommands)
    ]);
    console.log("Successfully");
}
exports.reloadCommands = reloadCommands;
