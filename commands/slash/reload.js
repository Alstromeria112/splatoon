// @ts-check

"use strict";

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getEnv } = require("../../util.js");
const { reloadCommands } = require("../../commands-manager.js");

/** @type {import("../../type").SlashCommand} */
module.exports = {
    data: new SlashCommandBuilder().setName("reload").setDescription("Reload bot.").toJSON(),
    handler: async interaction => {
        try {
            if (
                interaction.user.id !== getEnv("OWNER_ID") &&
                !getEnv("MAINTAINERS_ID").split(",").includes(interaction.user.id)
            ) {
                await interaction.reply("このコマンドはbotの管理者以外実行できません。");
                return;
            }
            const embed = new EmbedBuilder()
                .setTitle("Reloading...")
                .setColor("#ff0000")
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
            console.log("Reloading...");

            await reloadCommands();
            const suc = new EmbedBuilder()
                .setTitle(getEnv("SUCCESS"))
                .setColor("#00ffff")
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                .setTimestamp();
            await interaction.editReply({ embeds: [suc] });
        } catch (e) {
            const embed = new EmbedBuilder()
                .setTitle(getEnv("ERROR"))
                .setDescription(`\`\`\`${e}\`\`\``)
                .setColor("#ff0000")
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
    }
};
