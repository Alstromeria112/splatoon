// @ts-check

"use strict";

const { readdir } = require("node:fs/promises");
const fs = require("node:fs");
const path = require("node:path");
const { Collection } = require("discord.js");
const { log } = require("./util.js");

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

async function getAllFiles(dirPath) {
    const files = await readdir(dirPath);
    const filePaths = [];
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.statSync(filePath);
        if (stats.isDirectory()) {
            filePaths.push(...(await getAllFiles(filePath)));
        } else if (stats.isFile() && file.endsWith(".js")) {
            filePaths.push(filePath);
        }
    }
    return filePaths;
}

/**
 * @type {import("./type.js").reloadAnyTypeCommandsFunctionType}
 */
async function reloadAnyTypeCommands(commandDirPaths, commandsCollection) {
    commandsCollection.clear();
    const commandFilePaths = await getAllFiles(commandDirPaths);
    for (const filePath of commandFilePaths) {
        log("Load module: " + filePath);
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
        log(`[ DELETE CACHE ] ${name}`);
        delete require.cache[name];
    }
    await Promise.all([
        reloadAnyTypeCommands(slashCommandsPath, slashCommands),
        reloadAnyTypeCommands(messageCommandsPath, messageCommands)
    ]);
    log("Successfully");
}
exports.reloadCommands = reloadCommands;
