// @ts-check

"use strict";

const { ButtonInteraction, ChatInputCommandInteraction, ChannelType, EmbedBuilder } = require("discord.js");

/**
 * @param {string} name
 * @returns {string}
 */
function getEnv(name) {
    const value = process.env[name];
    if (typeof value !== "string") {
        log(`[ ERROR ] ${name} is not present in \`.env\`. exiting...`);
        process.exit(1);
    }
    return value;
}
exports.getEnv = getEnv;

/**
 * @param {String} text
 */
function log(text) {
    console.log(`[${getDateString(new Date())}]`, text);
}
exports.log = log;

/**
 * @param {Date | undefined} date
 * @returns {string}
 */
function getDateString(date = new Date()) {
    return (
        `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")} ` +
        `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`
    );
}
exports.getDateString = getDateString;

/**
 * @param { ButtonInteraction | ChatInputCommandInteraction } interaction
 * @param { boolean } type
 * @param { any } error
 */
async function sendEmbed(interaction, type, error) {
    let interactionType;
    let commandType;
    if (interaction.isChatInputCommand()) {
        commandType = interaction;
        interactionType = "Chat Input";
    } else if (interaction.isButton()) {
        commandType = interaction.customId;
        interactionType = "Button";
    } else return;

    const guild = await interaction.client.guilds.fetch(getEnv("GUILD_ID"));
    const channel = await guild?.channels.fetch(getEnv("CHANNEL_ID"));

    if (!channel || !interaction.guild) return;
    if (channel.type === ChannelType.GuildText) {
        let embed = new EmbedBuilder();
        if (type === true) {
            embed = new EmbedBuilder()
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
                    { name: "Type", value: `\`\`\`${interactionType}\`\`\``, inline: true },
                    { name: "Command", value: `\`\`\`${commandType}\`\`\``, inline: false }
                )
                .setColor("#00ff00")
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                .setTimestamp();
        } else if (type === false) {
            embed = new EmbedBuilder()
                .setTitle("Bad Request")
                .setAuthor({
                    name: interaction.user.tag + ` (${interaction.user.id})`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setDescription(`\`\`\`${error}\`\`\``)
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
        }
        return channel.send({ embeds: [embed] });
    }
}
exports.sendEmbed = sendEmbed;
