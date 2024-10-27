// @ts-check

const { EmbedBuilder } = require("discord.js");
const { getEnv } = require("../../util");

/** @type {import("../../type").MessageCommand} */
module.exports = {
    data: {
        name: "ping"
    },
    handler: async message => {
        const client = message.client;
        const embed = new EmbedBuilder()
            .setTitle(`Ping: ${client.ws.ping} ms`)
            .setFooter({
                text: getEnv("POWERED"),
                iconURL: getEnv("ICON_URL")
            })
            .setColor("#00ffff")
            .setTimestamp()
            .toJSON();
        await message.reply({ embeds: [embed] });
    }
};
