// @ts-check

const { SlashCommandBuilder, Colors, ButtonStyle } = require("discord.js");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("@discordjs/builders");
const { getEnv } = require("../../../util");
const host = new Set();

/** @type {import("../../../type").Interaction} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName("night")
        .setDescription("深夜部を募集します。")
        .addStringOption(option =>
            option.setName("description").setDescription("この募集に関する説明を入力してください。").setRequired(true)
        )
        .toJSON(),
    handler: async interaction => {
        if (interaction.isChatInputCommand()) {
            if (host.has(interaction.user.id)) {
                return interaction.reply({
                    content: `既に募集しているため新しく募集できません。\n過去に締めていない募集があれば、それを締めてから再度募集してください。`,
                    ephemeral: true
                });
            }

            const description = interaction.options.getString("description");
            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.displayAvatarURL() })
                .setTitle("深夜部募集")
                .setDescription(description)
                .setColor(Colors.Purple)
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") });

            const button = new ButtonBuilder().setCustomId("night/close").setLabel("〆").setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder().addComponents(button);

            await interaction.reply({
                content: `<@&${getEnv("NIGHT_ID")}>`,
                embeds: [embed],
                // @ts-ignore
                components: [row],
                allowedMentions: { parse: ["roles"] }
            });
            host.add(interaction.user.id);
        }
        return;
    },
    buttonHandler: async interaction => {
        if (interaction.customId === "night/close") {
            host.delete(interaction.user.id);
            return interaction.reply(`〆(<@${interaction.user.id}>)`);
        }
    }
};
