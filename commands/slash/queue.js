// @ts-check

"use strict";

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { GuildMusicQueue } = require("../../structures/GuildMusicQueue.js");
const { getEnv } = require("../../util.js");

/** @type {import("../../type").SlashCommand} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("queue info.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("現在入っているキューの一覧を取得します。")
                .addIntegerOption(option =>
                    option.setName("page").setDescription("page number.").setRequired(false)
                )
        )
        .setDMPermission(false)
        .toJSON(),
    handler: async interaction => {
        if (!interaction.inCachedGuild() || !interaction.isChatInputCommand()) return;

        if (interaction.options.getSubcommand() === "list") {
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
                        `\`\`\`プレイリストはそのチャンネルに属していません。\n<#${queue.voiceChannelId}>に参加してください。\`\`\``
                    )
                    .setColor("#ff0000")
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                return;
            }

            let queueSongs = queue.getQueue();
            let queueString = queueSongs
                .map((song, index) => `${index + 1}. ${song.title}`)
                .join(",\n");
            const embed = new EmbedBuilder()
                .setTitle(`プレイリスト`)
                .setDescription(`\`\`\`${queueString}\`\`\``)
                .setColor("#00ffff")
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }
    }
};
