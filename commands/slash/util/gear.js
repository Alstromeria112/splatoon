const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getEnv, log } = require("../../../util");
const fs = require("node:fs");

const gearData = JSON.parse(fs.readFileSync("/home/alstromeria/Project/splatoon/db/geardata.json"));

/** @type {import("../../../type").SlashCommand} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName("gear")
        .setDescription("ランダムなギアを出力します")
        .addSubcommand(subcommand =>
            subcommand.setName("yourself").setDescription("あなたが使うギアパワーをランダムに決めます。")
        )
        .addSubcommand(subcommand =>
            subcommand.setName("alluser").setDescription("VC内にいるユーザー全員の使うギアパワーをランダムに決めます。")
        )
        .toJSON(),
    handler: async interaction => {
        if (!interaction.inCachedGuild() || !interaction.isChatInputCommand()) return;
        if (interaction.options.getSubcommand(true) === "yourself") {
            return interaction.reply(getRandom());
        } else if (interaction.options.getSubcommand(true) === "alluser") {
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
                    response += `<@${member.id}>\n${random}\n`;
                }

                const embed = new EmbedBuilder()
                    .setAuthor({ name: "Result", iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(response)
                    .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                    .setColor("#00ffff");

                return interaction.reply({ embeds: [embed] });
            } catch (e) {
                log(e);
                return interaction.reply("Error. Please contact as administrator.");
            }
        }
    }
};

function getRandom() {
    const headPowers = [...gearData.common, ...gearData.exclusive["アタマ"]];
    const clotchingPowers = [...gearData.common, ...gearData.exclusive["フク"]];
    const shoesPowers = [...gearData.common, ...gearData.exclusive["クツ"]];

    const headGear = headPowers[Math.floor(Math.random() * headPowers.length)];
    const clotchingGear = clotchingPowers[Math.floor(Math.random() * clotchingPowers.length)];
    const shoesGear = shoesPowers[Math.floor(Math.random() * shoesPowers.length)];
    return `アタマ: ${headGear}\nフク: ${clotchingGear}\nクツ: ${shoesGear}`;
}
