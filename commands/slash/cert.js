// @ts-check

"use strict";

const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    GuildMember
} = require("discord.js");
const { getEnv } = require("../../util.js");

/** @type {import("../../type").SlashCommand} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName("cert")
        .setDescription("Certification commands")
        .addSubcommand(subcommand => subcommand.setName("send").setDescription("Send cert"))
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .toJSON(),
    handler: async interaction => {
        if (interaction.isChatInputCommand()) {
            if (interaction.options.getSubcommand() === "send") {
                if (
                    interaction.user.id !== getEnv("OWNER_ID") &&
                    !getEnv("MAINTAINERS_ID").split(",").includes(interaction.user.id)
                ) {
                    return interaction.reply({
                        content: "This command can only be executed by the admin of the bot.",
                        ephemeral: true
                    });
                }
                const check = new ButtonBuilder()
                    .setCustomId("cert/check")
                    .setStyle(ButtonStyle.Success)
                    .setLabel("✅");
                const row = new ActionRowBuilder().addComponents(check);
                await interaction.reply("Successfully sended.");
                // @ts-ignore
                return interaction.channel.send({ components: [row] });
            }
        } else if (interaction.isButton()) {
            if (interaction.customId === "cert/check") {
                const member = interaction.member;
                try {
                    if (member instanceof GuildMember) {
                        await member.roles.add(getEnv("MEMBER_ROLE_ID"));
                        return interaction.reply({
                            content: "メンバーロールを付与しました。",
                            ephemeral: true
                        });
                    }
                } catch (e) {
                    console.error(e);
                    return interaction.reply({
                        content:
                            "ロールの付与に失敗しました。\n申し訳ありませんが、<#1285620212053315758>にてスレッドを作成してください。",
                        ephemeral: true
                    });
                }
            }
        }
    }
};
