// @ts-check

"use strict";
Error.stackTraceLimit = Infinity;

const { Client, EmbedBuilder, GatewayIntentBits: IntentBits, ChannelType } = require("discord.js");
const { interactions, messageCommands, reloadCommands } = require("./commands-manager.js");
const { getEnv, sendEmbed, log } = require("./util.js");
require("dotenv/config.js");

const client = new Client({
    intents: [IntentBits.Guilds, IntentBits.GuildMessages, IntentBits.MessageContent, IntentBits.GuildVoiceStates]
});

client.on("interactionCreate", async interaction => {
    if (interaction.isChatInputCommand() || interaction.isButton() || interaction.isModalSubmit()) {
        // maintenance mode
        // if (
        //     interaction.user.id !== getEnv("OWNER_ID") &&
        //     !getEnv("MAINTAINERS_ID").split(",").includes(interaction.user.id)
        // ) {
        //     const embed = new EmbedBuilder()
        //         .setTitle(getEnv("ERROR"))
        //         .setDescription(
        //             "現在メンテナンス中です。\n[詳細はこちら](https://discord.com/channels/1047808586702671902/1283571082556739645)"
        //         )
        //         .setColor("Red")
        //         .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
        //         .setTimestamp();
        //     return interaction.reply({
        //         embeds: [embed],
        //         ephemeral: true
        //     });
        // }

        const commandName = interaction.isChatInputCommand()
            ? interaction.commandName
            : interaction.customId.slice(0, interaction.customId.indexOf("/"));
        const command = interactions.get(commandName);
        if (!command) {
            const errEmbed = new EmbedBuilder()
                .setTitle(getEnv("ERROR"))
                .setDescription(`\`\`\`Unknown interaction: ${commandName}\`\`\``)
                .setColor("#ff0000")
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                .setTimestamp();
            interaction.reply({ embeds: [errEmbed] });
            return;
        }
        try {
            if (interaction.isChatInputCommand()) {
                await command.handler(interaction);
            } else if (interaction.isButton()) {
                await command.buttonHandler(interaction);
            } else if (interaction.isModalSubmit()) {
                await command.modalHandler(interaction);
            }
            return sendEmbed(interaction, true, null);
        } catch (e) {
            const embed = new EmbedBuilder()
                .setTitle(getEnv("ERROR"))
                .setDescription(`\`\`\`${e}\`\`\``)
                .setColor("#ff0000")
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") });
            interaction.reply({ embeds: [embed] });
            return sendEmbed(interaction, false, e);
        }
    }
});

client.on("messageCreate", async message => {
    messageCommands.forEach(async command => {
        const prefix = `${getEnv("PREFIX")}${command.data.name}`;
        if (!message.content.startsWith(prefix)) return;
        if (!(message.content === prefix || message.content.slice(prefix.length).match(/^\s/))) return;
        try {
            await command.handler(message);
        } catch (e) {
            message.reply(`Unknown command: ${command.data.name}`);
        }
    });
});

client.on("voiceStateUpdate", (oldState, newState) => {
    // commands-manager.js がキャッシュを削除する影響により，
    // top level で GuildMusicQueue.js を require してはいけない。
    const { GuildMusicQueue } = require("./structures/GuildMusicQueue.js");

    if (oldState.channelId && !newState.channelId && oldState.id === client.user?.id) {
        GuildMusicQueue.get(oldState.guild.id)?.destroy();
    }
});

client.on("ready", client => {
    log(`[ CONSOLE ] <Slash> ${interactions.map(command => command.data.name).join(", ")} is loaded`);
    log(`[ CONSOLE ] <Text> ${messageCommands.map(command => command.data.name).join(", ")} is loaded`);
    log(`[ CONSOLE ] Logged in as ${client.user.tag}`);
});

const join = require("./structures/join.js");
join(client);

~(async function () {
    await reloadCommands();

    client.login(getEnv("TOKEN"));
})();
