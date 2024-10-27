// @ts-check

"use strict";

const { EmbedBuilder } = require("discord.js");
const { getEnv } = require("../../util.js");
const { reloadCommands } = require("../../commands-manager.js");

/** @type {import("../../type").MessageCommand} */
module.exports = {
    data: {
        name: "reload"
    },
    handler: async message => {
        try {
            if (
                message.author.id !== getEnv("OWNER_ID") &&
                !getEnv("MAINTAINERS_ID").split(",").includes(message.author.id)
            ) {
                const embed = new EmbedBuilder()
                    .setTitle(getEnv("ERROR"))
                    .setDescription(
                        `\`\`\`このコマンドはbotの管理者以外実行できません。\nThis command can only be executed by the admin of the bot.\`\`\``
                    )
                    .setColor("#ff0000")
                    .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                    .setTimestamp();
                await message.reply({ embeds: [embed] });
                return;
            }
            const embed = new EmbedBuilder()
                .setTitle("Reloading...")
                .setColor("#ff0000")
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                .setTimestamp();
            const reply = await message.reply({ embeds: [embed] });
            console.log("Reloading...");

            await reloadCommands();
            const suc = new EmbedBuilder()
                .setTitle(getEnv("SUCCESS"))
                .setColor("#00ffff")
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                .setTimestamp();
            await reply.edit({ embeds: [suc] });
        } catch (e) {
            const embed = new EmbedBuilder()
                .setTitle(getEnv("ERROR"))
                .setDescription(`\`\`\`${e}\`\`\``)
                .setColor("#ff0000")
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                .setTimestamp();
            const reply = await message.reply({ embeds: [embed] });
            await reply.edit({ embeds: [embed] });
        }
    }
};
