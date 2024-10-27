// @ts-check

const { getEnv } = require("../util");
const { Client, ChannelType, Colors, EmbedBuilder } = require("discord.js");

/**
 * @param {Client} client
 */
module.exports = client => {
    client.once("ready", () => {
        console.log("[ STRUCTURE ] join is loaded");
    });

    client.on("guildMemberAdd", async member => {
        if (member.guild.id !== getEnv("GUILD_ID")) return;
        const guild = await client.guilds.cache.get(getEnv("GUILD_ID"));
        const channel = await guild?.channels.cache.get(getEnv("CHANNEL_ID"));
        if (channel?.type === ChannelType.GuildText) {
            const mention = `<@${member.id}>`;
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `${member.displayName} (${member.id})`,
                    iconURL: member.displayAvatarURL()
                })
                .setDescription(`${mention} Joined the guild.`)
                .setColor(Colors.Green)
                .setTimestamp();
            return channel.send({ embeds: [embed] });
        }
        const welcome = await guild?.channels.cache.get(getEnv("WELCOME_CHANNEL_ID"));
        if (welcome?.type === ChannelType.GuildText) {
            const mention = `<@${member.id}>`;
            return welcome.send({
                content: `<@${mention}> さん、**${guild?.name}**へようこそ！\n<#1283570922783244299>に記載されている内容をよく読んだ上で✅を押し、会話を始めましょう！\n不明点・質問等ありましたら、<#1285620212053315758>にて、スレッドを作成してください。`
            });
        }
    });

    client.on("guildMemberRemove", async member => {
        if (member.guild.id !== getEnv("GUILD_ID")) return;
        const guild = await client.guilds.cache.get(getEnv("GUILD_ID"));
        const channel = await guild?.channels.cache.get(getEnv("CHANNEL_ID"));
        if (channel?.type === ChannelType.GuildText) {
            const mention = `<@${member.id}>`;
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `${member.displayName} (${member.id})`,
                    iconURL: member.displayAvatarURL()
                })
                .setDescription(`${mention} Left the guild.`)
                .setColor(Colors.Red)
                .setTimestamp();
            return channel.send({ embeds: [embed] });
        }
    });
};
