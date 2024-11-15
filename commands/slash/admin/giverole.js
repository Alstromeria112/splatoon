// @ts-check

"use strict";

const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    GuildMember
} = require("discord.js");
const { getEnv, log } = require("../../../util.js");

/** @type {import("../../../type.js").SlashCommand} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName("giverole")
        .setDescription("giverole commands")
        .addSubcommand(subcommand =>
            subcommand.setName("send").setDescription("Send giverole button (required bot owner)")
        )
        .setDMPermission(false)
        // .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .toJSON(),
    handler: async interaction => {
        if (interaction.isChatInputCommand()) {
            if (interaction.options.getSubcommand() === "send") {
                if (interaction.user.id !== getEnv("OWNER_ID")) {
                    const embed = new EmbedBuilder()
                        .setTitle(getEnv("ERROR"))
                        .setDescription(
                            "このコマンドはbotの管理者以外実行できません。\nThis command can only be executed by the bot owner."
                        )
                        .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") })
                        .setColor("#ff0000")
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }
                const day = new ButtonBuilder()
                    .setCustomId("giverole/member")
                    .setStyle(ButtonStyle.Primary)
                    .setLabel("✅️");
                const row = new ActionRowBuilder().addComponents(day);
                // @ts-ignore
                await interaction.reply({ components: [row] });
                // return interaction.reply({
                //     content: "現在このコマンドは利用できません。",
                //     ephemeral: true
                // });
            }
        } else if (interaction.isButton()) {
            if (interaction.customId === "giverole/member") {
                const member = interaction.member;
                try {
                    if (interaction.guild) {
                        const o = interaction.guild.members.cache.get(interaction.user.id);
                        if (o?.roles.cache.has(getEnv("MEMBER_ROLE_ID"))) {
                            return interaction.reply({
                                content: `既に<@&${getEnv("MEMBER_ROLE_ID")}>を持っています。`,
                                ephemeral: true
                            });
                        }
                    }
                    if (member instanceof GuildMember) {
                        await member.roles.add(getEnv("MEMBER_ROLE_ID"));
                        return interaction.reply({
                            content: `<@&${getEnv("MEMBER_ROLE_ID")}>を付与しました。`,
                            ephemeral: true
                        });
                    }
                } catch (e) {
                    log(e);
                    return interaction.reply({
                        content:
                            "ロールの付与に失敗しました。\n申し訳ありませんが、<#1285620212053315758>までお問い合わせ願います。",
                        ephemeral: true
                    });
                }
            }
        }
    }
};
