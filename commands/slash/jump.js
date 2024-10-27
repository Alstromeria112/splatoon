// @ts-check

"use strict";

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { GuildMusicQueue } = require("../../structures/GuildMusicQueue.js");
const { getEnv } = require("../../util.js");

/** @type {import("../../type").SlashCommand} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("曲を複数スキップします")
        .setDMPermission(false)
        .addNumberOption(option =>
            option
                .setName("number")
                .setDescription("スキップする曲数を入力してください。")
                .setRequired(true)
        )
        .toJSON(),
    handler: async interaction => {
        if (!interaction.inCachedGuild() || !interaction.isChatInputCommand()) return;

        const channel = interaction.member.voice.channel;
        if (!channel) {
            const embed = new EmbedBuilder()
                .setTitle(getEnv("ERROR"))
                .setDescription(`\`\`\`先にボイスチャンネルに参加してください。\`\`\``)
                .setColor("#ff0000")
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
            return;
        }

        const queue = GuildMusicQueue.get(channel.guildId);
        if (!queue) {
            const embed = new EmbedBuilder()
                .setTitle(getEnv("ERROR"))
                .setDescription(`\`\`\`プレイリストが存在しません。\`\`\``)
                .setColor("#ff0000")
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
            return;
        }
        if (queue.voiceChannelId !== channel.id) {
            const embed = new EmbedBuilder()
                .setTitle(getEnv("ERROR"))
                .setDescription(
                    `\`\`\`プレイリストはそのチャンネルに属していません。<#${queue.voiceChannelId}>に参加してください。\`\`\``
                )
                .setColor("#ff0000")
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
            return;
        }

        const seconds = interaction.options.getNumber("number", true);
        queue.jump(seconds);
        await interaction.reply(getEnv("SUCCESS"));
    }
};
