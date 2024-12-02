// @ts-check

"use strict";

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const ytdl = require("@distube/ytdl-core");
const ytpl = require("ytpl");
const { GuildMusicQueue, ParsedMusicInfo } = require("../../../structures/GuildMusicQueue.js");
const { getEnv, log } = require("../../../util.js");

/** @type {import("../../../type").Interaction} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("YouTube上の動画を再生します。")
        .addStringOption(option =>
            option.setName("query").setDescription("キーワードまたはURLを入力してください。").setRequired(true)
        )
        .setDMPermission(false)
        .toJSON(),
    handler: async interaction => {
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply();
        const query = interaction.options.getString("query", true);
        const playlistIdRegex = /list=([a-zA-Z0-9_-]+)/;
        const match = query.match(playlistIdRegex);
        const playlistId = match ? match[1] : null;
        if (playlistId) {
            const channel = interaction.member.voice.channel;
            if (!channel) {
                const embed = new EmbedBuilder()
                    .setTitle(getEnv("ERROR"))
                    .setDescription(`\`\`\`先にボイスチャンネルに参加してください。\`\`\``)
                    .setColor("#ff0000")
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
                return;
            }
            await interaction.editReply("リストの中身を取得中...");
            try {
                const queue = GuildMusicQueue.getOrCreate(channel);
                const { items, author, title, views, thumbnails, description, url } = await ytpl(playlistId);

                for (let i = 0; i < items.length; i++) {
                    await interaction.editReply({
                        content: `リストの中身を処理中... (${i + 1}/${items.length})`
                    });
                    const parsedRequest = await ParsedMusicInfo.create(items[i].url);
                    queue.addRequest(parsedRequest);
                    const info = await ytdl.getBasicInfo(parsedRequest.videoUrl);
                    const embed = new EmbedBuilder()
                        .setAuthor({
                            name: parsedRequest.channelName,
                            iconURL: parsedRequest.channelIconUrl,
                            url: parsedRequest.channelUrl
                        })
                        .setTitle(parsedRequest.videoName)
                        .setURL(parsedRequest.videoUrl)
                        .setImage(parsedRequest.videoThumbnailUrl)
                        .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                        .setColor("#00ffff")
                        .setTimestamp();
                    await interaction.editReply({ embeds: [embed] });
                }

                const embed = new EmbedBuilder()
                    .setTitle(title)
                    .setURL(url)
                    .setAuthor({
                        name: author.name,
                        iconURL: author.bestAvatar.url?.toString(),
                        url: author.url
                    })
                    .addFields(
                        [
                            {
                                name: "曲数",
                                value: `${items.length}曲`
                            },
                            { name: "再生数", value: `${views}回` },
                            {
                                name: "説明",
                                value: description?.toString() || "null"
                            }
                        ].map(f => ({ ...f, inline: true }))
                    )
                    .setImage(thumbnails[0].url)
                    .setColor("#00ffff")
                    .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                    .setTimestamp();
                setTimeout(() => {
                    interaction.editReply({ content: "", embeds: [embed] });
                }, 1000);
            } catch (e) {
                const embed = new EmbedBuilder()
                    .setTitle(getEnv("ERROR"))
                    .setDescription(`\`\`\`${e}\`\`\``)
                    .setColor("#ff0000")
                    .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                    .setTimestamp();
                await interaction.editReply({ content: "", embeds: [embed] });
                log(e);
                return;
            }
        } else {
            const query = interaction.options.getString("query", true);
            /** @type {ParsedMusicInfo} */
            let parsedRequest;

            parsedRequest = await ParsedMusicInfo.create(query);
            const channel = interaction.member.voice.channel;
            if (!channel) {
                const embed = new EmbedBuilder()
                    .setTitle(getEnv("ERROR"))
                    .setDescription(`\`\`\`先にボイスチャンネルに参加してください。\`\`\``)
                    .setColor("#ff0000")
                    .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
                return;
            }
            try {
                const queue = GuildMusicQueue.getOrCreate(channel);
                queue.addRequest(parsedRequest);

                const info = await ytdl.getBasicInfo(parsedRequest.videoUrl);
                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: parsedRequest.channelName,
                        iconURL: parsedRequest.channelIconUrl,
                        url: parsedRequest.channelUrl
                    })
                    .setTitle(parsedRequest.videoName)
                    .setURL(parsedRequest.videoUrl)
                    .addFields(
                        {
                            name: "再生時間",
                            value: formatDuration(info.videoDetails.lengthSeconds),
                            inline: true
                        },
                        {
                            name: "再生数",
                            value: formatViewCount(info.videoDetails.viewCount),
                            inline: true
                        },
                        {
                            name: "投稿日",
                            value: new Date(info.videoDetails.uploadDate).toLocaleDateString("ja-JP"),
                            inline: true
                        }
                    )
                    .setImage(parsedRequest.videoThumbnailUrl)
                    .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                    .setColor("#00ffff")
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
            } catch (e) {
                const embed = new EmbedBuilder()
                    .setTitle(getEnv("ERROR"))
                    .setDescription(`\`\`\`${e}\`\`\``)
                    .setColor("#ff0000")
                    .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                    .setTimestamp();
                await interaction.editReply({ content: "", embeds: [embed] });
                log(e);
                return;
            }
        }
    }
};

function formatDuration(duration) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    return `${hours ? `${hours}:` : ""}${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatViewCount(viewCount) {
    if (viewCount < 1e4) return String(viewCount);
    if (viewCount < 1e8) return `${Math.floor(viewCount / 1e4)}万`;
    if (viewCount < 1e12) return `${Math.floor(viewCount / 1e8)}億`;
    return `${Math.floor(viewCount / 1e12)}兆`;
}
