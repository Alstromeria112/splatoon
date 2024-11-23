// @ts-check

const { getEnv, log } = require("../util");
const { ChannelType, Colors, EmbedBuilder } = require("discord.js");

module.exports = client => {
    client.once("ready", () => {
        log("[ STRUCTURE ] join is loaded");
    });

    client.on("guildMemberAdd", async member => {
        const guild = await client.guilds.fetch(getEnv("GUILD_ID"));
        const channel = await guild.channels.fetch(getEnv("CHANNEL_ID"));
        if (!guild || !channel) return;
        if (channel.type === ChannelType.GuildText) {
            const mention = `<@${member.id}>`;
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: `${member.displayName} (${member.id})`,
                    iconURL: member.displayAvatarURL()
                })
                .setDescription(`${mention} Joined the guild.`)
                .setColor(Colors.Green)
                .setTimestamp();
            channel.send({ embeds: [embed] });
        }
        // const welcome = await guild?.channels.cache.get(getEnv("WELCOME_CHANNEL_ID"));
        // if (welcome?.type === ChannelType.GuildText) {
        //     const mention = `<@${member.id}>`;
        //     return welcome.send({
        //         content: `<@${mention}> さん、**${guild?.name}**へようこそ！\n<#1283570922783244299>に記載されている内容をよく読んだ上で✅を押し、会話を始めましょう！\n不明点・質問等ありましたら、<#1285620212053315758>にて、スレッドを作成してください。`
        //     });
        // }
    });

    client.on("guildMemberRemove", async member => {
        if (member.guild.id !== getEnv("GUILD_ID")) return;
        const guild = await client.guilds.fetch(getEnv("GUILD_ID"));
        const channel = await guild.channels.fetch(getEnv("CHANNEL_ID"));
        if (!guild || !channel) return;
        if (channel.type === ChannelType.GuildText) {
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
