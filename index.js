// @ts-check

"use strict";
Error.stackTraceLimit = Infinity;

const { Client, EmbedBuilder, GatewayIntentBits: IntentBits, ChannelType } = require("discord.js");
const { slashCommands, messageCommands, reloadCommands } = require("./commands-manager.js");
const { getEnv } = require("./util.js");
require("dotenv/config.js");

const guildId = getEnv("GUILD_ID");
const channelId = getEnv("CHANNEL_ID");

const client = new Client({
    intents: [IntentBits.Guilds, IntentBits.GuildMessages, IntentBits.MessageContent, IntentBits.GuildVoiceStates]
});

client.on("interactionCreate", async interaction => {
    if (!interaction.inCachedGuild()) return;
    let interactionType;
    let commandType;
    if (interaction.isChatInputCommand()) {
        commandType = interaction;
        interactionType = "Chat Input Command";
    } else if (interaction.isButton()) {
        commandType = interaction.customId;
        interactionType = "Button";
    } else {
        return;
    }
    const commandName = interaction.isChatInputCommand()
        ? interaction.commandName
        : interaction.customId.slice(0, interaction.customId.indexOf("/"));
    const command = slashCommands.get(commandName);
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
        await command.handler(interaction);
        const lguild = await interaction.client.guilds.fetch(guildId);
        const lchannel = await lguild.channels.fetch(channelId);
        if (!lguild || !lchannel) return;
        if (lchannel.type === ChannelType.GuildText) {
            const embed = new EmbedBuilder()
                .setTitle("Add Request")
                .setAuthor({
                    name: interaction.user.tag + ` (${interaction.user.id})`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .addFields(
                    {
                        name: "Guild",
                        value: `\`\`\`${interaction.guild.name}\n${interaction.guild.id}\`\`\``,
                        inline: true
                    },
                    { name: "Type", value: `\`\`\`${interactionType}\`\`\``, inline: false },
                    { name: "Command", value: `\`\`\`${interaction}\`\`\``, inline: false }
                )
                .setColor("#00ff00")
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                .setTimestamp();
            await lchannel.send({ embeds: [embed] });
        }
    } catch (e) {
        console.log(e);
        const lguild = await interaction.client.guilds.fetch(guildId);
        const lchannel = await lguild.channels.fetch(channelId);
        if (!lguild || !lchannel) return;
        if (lchannel.type === ChannelType.GuildText) {
            const embed = new EmbedBuilder()
                .setTitle("Bad Request")
                .setAuthor({
                    name: interaction.user.tag + ` (${interaction.user.id})`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setDescription(`\`\`\`${e}\`\`\``)
                .addFields(
                    {
                        name: "Guild",
                        value: `\`\`\`${interaction.guild.name}\n${interaction.guild.id}\`\`\``,
                        inline: true
                    },
                    { name: "Type", value: `\`\`\`${interactionType}\`\`\``, inline: false },
                    { name: "Command", value: `\`\`\`${commandType}\`\`\``, inline: false }
                )
                .setColor("#ff0000")
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                .setTimestamp();
            await lchannel.send({ embeds: [embed] });
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
    console.log(`[ CONSOLE ] <Slash> ${slashCommands.map(command => command.data.name).join(", ")} is loaded`);
    console.log(`[ CONSOLE ] <Text> ${messageCommands.map(command => command.data.name).join(", ")} is loaded`);
    console.log(`[ CONSOLE ] Logged in as ${client.user.tag}`);
});

~(async function () {
    await reloadCommands();

    client.login(getEnv("TOKEN"));
})();

const join = require("./structures/join.js");
Promise.all([join(client)]).catch(console.error);
