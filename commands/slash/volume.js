// @ts-check

"use strict";

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { GuildMusicQueue } = require("../../structures/GuildMusicQueue.js");
const { getEnv } = require("../../util.js");

/** @type {import("../../type").SlashCommand} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName("volume")
        .setDescription("change volume.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("set volume.")
                .addNumberOption(option =>
                    option
                        .setName("volume")
                        .setDescription("volume.")
                        .setMinValue(0)
                        .setMaxValue(100)
                        .setRequired(true)
                )
        )
        .setDMPermission(false)
        .toJSON(),
    handler: async interaction => {
        if (!interaction.inCachedGuild()) return;
        if (interaction.isChatInputCommand()) {
            const channel = interaction.member.voice.channel;
            if (!channel) {
                const embed = new EmbedBuilder()
                    .setTitle(getEnv("ERROR"))
                    .setDescription(
                        `\`\`\`先にボイスチャンネルに参加してください。\`\`\``
                    )
                    .setColor("#ff0000")
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                return;
            }

            const queue = GuildMusicQueue.get(channel.guildId);
            if (!queue) {
                const embed = new EmbedBuilder()
                    .setTitle(getEnv("ERROR"))
                    .setDescription(
                        `\`\`\`プレイリストが存在しません。\`\`\``
                    )
                    .setColor("#ff0000")
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                return;
            }
            if (queue.voiceChannelId !== channel.id) {
                const embed = new EmbedBuilder()
                    .setTitle(getEnv("ERROR"))
                    .setDescription(
                        `\`\`\`プレイリストはそのチャンネルに属していません。\n<#${queue.voiceChannelId}>に参加してください。\`\`\``
                    )
                    .setColor("#ff0000")
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                return;
            }
            if (interaction.options.getSubcommand() === "set") {
                const volume = interaction.options.getNumber("volume") || 5;
                queue.setVolume(volume);
                await interaction.reply(getEnv("SUCCESS"));
            }
        }
    }
}

