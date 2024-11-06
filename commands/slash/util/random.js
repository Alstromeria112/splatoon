// @ts-check

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("node:fs");
const { getEnv } = require("../../../util.js");
const data = fs.readFileSync("/home/alstromeria/Project/splatoon/weapon.txt", "utf-8");

/** @type {import("../../../type").SlashCommand} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName("random")
        .setDescription("ランダムなブキを出力します")
        .addSubcommand(subcommand =>
            subcommand.setName("yourself").setDescription("あなたが使うブキをランダムに決めます。")
        )
        .addSubcommand(subcommand =>
            subcommand.setName("alluser").setDescription("VC内にいるユーザー全員の使うブキをランダムに決めます。")
        )
        .toJSON(),
    handler: async interaction => {
        if (!interaction.inCachedGuild() || !interaction.isChatInputCommand()) return;
        if (interaction.options.getSubcommand() === "yourself") {
            return interaction.reply(getRandom());
        } else if (interaction.options.getSubcommand() === "alluser") {
            const member = interaction.member;
            if (!member.voice.channel) {
                return interaction.reply("You are not connected in vc.");
            }

            const voiceChannel = member.voice.channel;
            const members = voiceChannel.members.filter(m => !m.user.bot);

            try {
                let response = "";
                for (const [memberId, member] of members) {
                    const random = getRandom();
                    response += `<@${member.id}>: ${random}\n`;
                }

                const embed = new EmbedBuilder()
                    .setAuthor({ name: "Result", iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(response)
                    .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                    .setColor("#00ffff");

                await interaction.reply({ embeds: [embed] });
            } catch (e) {
                console.error(e);
                return interaction.reply("Error. Please contact as administrator.");
            }
        }
    }
};

function getRandom() {
    const num = Math.floor(Math.random() * 130) + 1;
    const lines = data.split("\n");

    if (num > lines.length) {
        return `${num} is not found.`;
    }
    return lines[num - 1];
}
