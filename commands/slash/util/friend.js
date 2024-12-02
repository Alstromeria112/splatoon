// @ts-check

const {
    SlashCommandBuilder,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require("discord.js");
const { getEnv } = require("../../../util");
const fs = require("node:fs");
const path = require("node:path");
const filePath = path.resolve(__dirname, "../../../db/FriendCode.json");

/** @type {import("../../../type").Interaction} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName("friend")
        .setDescription("Friend code")
        .addSubcommand(subcommand =>
            subcommand.setName("show").setDescription("登録されたフレンドコードを表示します。")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("search")
                .setDescription("他のユーザーのフレンドコードを検索します。")
                .addUserOption(option =>
                    option.setName("user").setDescription("検索するユーザーを選択してください。").setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("register").setDescription("フレンドコードを登録/再登録します。")
        )
        .toJSON(),
    handler: async interaction => {
        if (interaction.options.getSubcommand(true) === "show") {
            const targetUser = interaction.user;
            const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            const fc = `${data[targetUser.id]}`;

            if (!fc) {
                const embed = new EmbedBuilder()
                    .setTitle(getEnv("ERROR"))
                    .setDescription(
                        "フレンドコードが見つかりません。\n登録していない場合は `/friend register`にて登録してください。"
                    )
                    .setColor("#ff0000")
                    .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") });
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const result = `SW-${fc.replace(/(\d{4})(?=\d)/g, "$1-")}`;
            const embed = new EmbedBuilder()
                .setAuthor({ name: targetUser.displayName, iconURL: targetUser.displayAvatarURL() })
                .setDescription(result)
                .setColor("#00ffff")
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") });
            return interaction.reply({ embeds: [embed] });
        } else if (interaction.options.getSubcommand(true) === "search") {
            return interaction.reply("coming soon...");
        } else if (interaction.options.getSubcommand(true) === "register") {
            const fc = new TextInputBuilder()
                .setCustomId("fc")
                .setLabel("フレンドコード(SW, ハイフン不要)")
                .setMinLength(12)
                .setMaxLength(12)
                .setPlaceholder("012345678901")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            const modal = new ModalBuilder()
                .setCustomId("friend/register")
                .setTitle("フレンドコードの登録")
                // @ts-ignore
                .addComponents(new ActionRowBuilder().addComponents(fc));
            await interaction.showModal(modal);
        }
    },
    modalHandler: async interaction => {
        if (interaction.customId === "friend/register") {
            const targetUser = interaction.user;
            const fc = interaction.fields.getTextInputValue("fc").toString();

            if (!/^\d{12}$/.test(fc)) {
                const embed = new EmbedBuilder()
                    .setTitle(getEnv("ERROR"))
                    .setDescription("不正な値を検出しました。\n有効な値は`0-9`です。")
                    .setColor("#ff0000")
                    .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") });
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const result = `SW-${fc.replace(/(\d{4})(?=\d)/g, "$1-")}`;
            const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            data[targetUser.id] = fc;
            fs.writeFileSync(filePath, JSON.stringify(data, null, 4), "utf-8");

            const embed = new EmbedBuilder()
                .setAuthor({ name: "Successfully registered.", iconURL: targetUser.displayAvatarURL() })
                .setDescription(`Friend Code:\n${result}`)
                .setColor("#00ffff")
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
