// @ts-check

"use strict";

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { GuildMusicQueue } = require("../../structures/GuildMusicQueue.js");
const { getEnv } = require("../../util.js");

/** @type {import("../../type").SlashCommand} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("曲をループします。")
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand.setName("queue").setDescription("プレイリストのすべての曲をループします。")
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

        if (interaction.options.getSubcommand() === "queue") {
            queue.toggleLoop();
        }
        await interaction.reply(getEnv("SUCCESS"));
    }
};
