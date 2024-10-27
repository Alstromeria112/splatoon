// @ts-check

"use strict";

const { REST, Routes } = require("discord.js");
const { getEnv } = require("./util.js");
const { reloadCommands, slashCommands } = require("./commands-manager.js");
require("dotenv/config.js");

const rest = new REST({ version: "10" }).setToken(getEnv("TOKEN"));

~(async function () {
    await reloadCommands();

    const body = [...slashCommands.values()].map(command => command.data);

    await rest.put(Routes.applicationCommands(getEnv("CLIENT_ID")), { body });
})();
