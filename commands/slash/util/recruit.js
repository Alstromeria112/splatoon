// @ts-check

const { SlashCommandBuilder, Colors, ButtonStyle } = require("discord.js");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("@discordjs/builders");
const { getEnv } = require("../../../util");
const host = new Map();

const configMap = new Map([
    ["regular", { id: getEnv("REGULAR_ID"), color: Colors.Green, title: "ナワバリ募集" }],
    ["bankara", { id: getEnv("BANKARA_ID"), color: Colors.Orange, title: "バンカラ募集" }],
    ["coop", { id: getEnv("COOP_ID"), color: Colors.Yellow, title: "サモラン募集" }],
    ["event", { id: getEnv("EVENT_ID"), color: Colors.Red, title: "イベント募集" }]
]);

/** @type {import("../../../type").Interaction} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName("recruit")
        .setDescription("募集をかけます。")
        .addStringOption(option =>
            option
                .setName("rule")
                .setDescription("募集するルールを選択してください。")
                .addChoices(
                    { name: "ナワバリ", value: "regular" },
                    { name: "バンカラ", value: "bankara" },
                    { name: "サモラン", value: "coop" },
                    { name: "イベマ", value: "event" }
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("peoples")
                .setDescription("募集する人数を選択してください。")
                .addChoices({ name: "1人", value: "1" }, { name: "2人", value: "2" }, { name: "3人", value: "3" })
                .setRequired(true)
        )
        .addStringOption(option => option.setName("description").setDescription("説明を入力してください。(省略可)"))
        .toJSON(),
    handler: async interaction => {
        if (interaction.isChatInputCommand()) {
            if (host.has(interaction.user.id)) {
                return interaction.reply({
                    content: `既に募集しているため新しく募集できません。\n過去に締めていない募集があれば、それを締めてから再度募集してください。\n`,
                    ephemeral: true
                });
            }
            const type = interaction.options.getString("rule", true);
            const peoples = interaction.options.getString("peoples", true);
            const description = interaction.options.getString("description", false);
            const config = configMap.get(type);

            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.displayAvatarURL() })
                .setTitle(config?.title ?? "Undefined")
                .setColor(config?.color ?? Colors.Default)
                .setDescription(
                    `${description ?? "説明無し"}\n募集人数: **@${peoples}**\n締める際は「〆」を押してください`
                )
                .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") });

            const button = new ButtonBuilder().setCustomId("recruit/close").setLabel("〆").setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder().addComponents(button);

            await interaction.reply({
                content: `<@&${config?.id}>`,
                embeds: [embed],
                // @ts-ignore
                components: [row],
                allowedMentions: { parse: ["roles"] }
            });
            host.set(interaction.user.id, await interaction.fetchReply());
        }
    },
    buttonHandler: async interaction => {
        if (interaction.customId === "recruit/close") {
            host.delete(interaction.user.id);
            return interaction.reply(`〆(<@${interaction.user.id}>)`);
        }
    }
};
