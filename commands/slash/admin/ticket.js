// @ts-check

const {
    SlashCommandBuilder,
    PermissionFlagsBits: Permission,
    Colors,
    ButtonStyle,
    ChannelType,
    OverwriteType
} = require("discord.js");
const { getEnv } = require("../../../util");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders");

/** @type {import("../../../type").Interaction} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("ticket")
        .setDMPermission(false)
        .setDefaultMemberPermissions(Permission.Administrator)
        .addSubcommand(subcommand => subcommand.setName("send").setDescription("send ticket."))
        .toJSON(),
    handler: async interaction => {
        if (interaction.isChatInputCommand()) {
            if (
                interaction.user.id !== getEnv("OWNER_ID") &&
                !getEnv("MAINTAINERS_ID").split(",").includes(interaction.user.id)
            ) {
                const embed = new EmbedBuilder()
                    .setTitle(getEnv("ERROR"))
                    .setDescription(
                        `\`\`\`このコマンドは<@${interaction.client.user.id}>の管理者以外実行できません。\`\`\``
                    )
                    .setColor(Colors.Red)
                    .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") });
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            if (interaction.options.getSubcommand() === "send") {
                const embed = new EmbedBuilder()
                    .setTitle("お問い合わせについて")
                    .setDescription(
                        "サーバーへの質問や要望、お困りごとなど、\n何かありましたら、遠慮なくチケットを作成してください。"
                    )
                    .setColor(Colors.Blue);
                const embed2 = new EmbedBuilder()
                    .setTitle("チケット作成はこちらから")
                    .setDescription("チケットを作成するには📤を押してください。")
                    .setColor(Colors.Blue)
                    .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("ticket/create")
                        .setLabel("📤チケットを作成")
                        .setStyle(ButtonStyle.Primary)
                );

                interaction.reply("Successfully sended.");
                // @ts-ignore
                return interaction.channel?.send({ embeds: [embed, embed2], components: [row] });
            }
        }
    },
    buttonHandler: async interaction => {
        if (interaction.customId === "ticket/create") {
            const guild = interaction.guild;
            if (!guild) return;
            const category = guild.channels.cache.get(getEnv("TICKET_CATEGORY_ID"));

            if (!category || category.type !== ChannelType.GuildCategory) return;
            const Number = category.children.cache.filter(channel => channel.type === ChannelType.GuildText).size - 1;
            const Name = `┗🎫｜ticket-#${Number}`;

            const Channel = await guild.channels.create({
                name: Name,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        deny: [Permission.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [Permission.ViewChannel]
                    },
                    {
                        id: getEnv("STAFF_ROLE_ID"),
                        allow: [Permission.ViewChannel]
                    }
                ]
            });

            const embed = new EmbedBuilder()
                .setDescription(`チケットチャンネル ${Channel} が作成されました。`)
                .setColor(Colors.Blue)
                .setTimestamp();
            interaction.reply({ embeds: [embed], ephemeral: true });

            const Embed = new EmbedBuilder()
                .setTitle("お問い合わせいただきありがとうございます。")
                .setDescription(
                    "本日はどのようなご用件でしょうか？\nサーバーへの質問や要望、お困りごとなど、\nお問い合わせ内容を簡潔にお送りください。\n**間違えて作成してしまった場合、その旨を記載してください。**"
                )
                .setColor(0x00ffff)
                .setTimestamp();

            const close = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("ticket/close")
                    .setLabel("🔒チケットをクローズ")
                    .setStyle(ButtonStyle.Danger)
            );

            return Channel.send({
                content: `${interaction.user}さん、こんにちは！`,
                embeds: [Embed],
                // @ts-ignore
                components: [close]
            });
        } else if (interaction.customId === "ticket/close") {
            if (
                interaction.user.id !== getEnv("OWNER_ID") &&
                !interaction.guild?.members.cache.get(interaction.user.id)?.permissions.has(Permission.ViewAuditLog)
            )
                return interaction.reply({
                    content:
                        "この操作はスタッフのみが行えます。\n間違ってチケットを作成してしまった場合は、その旨をお書き込みください。",
                    ephemeral: true
                });

            const Channel = interaction.channel;
            if (Channel?.type !== ChannelType.GuildText) return;
            const CreatorId = Channel.permissionOverwrites.cache.find(
                overwrite => overwrite.type === OverwriteType.Member && overwrite.allow.has(Permission.ViewChannel)
            )?.id;
            if (CreatorId) {
                Channel.permissionOverwrites.delete(CreatorId);
            }
            // const staffId = Channel.guild.roles.cache.get(getEnv("STAFF_ROLE_ID"));
            // const allowedRoleId = Channel.permissionOverwrites.cache.findKey(
            //     overwrite =>
            //         overwrite.type === OverwriteType.Role &&
            //         overwrite.id === staffId?.id &&
            //         overwrite.allow.has(Permission.ViewChannel)
            // );
            // if (allowedRoleId) {
            //     Channel.permissionOverwrites.delete(allowedRoleId);
            // }

            return interaction.reply({ content: `<@${interaction.user.id}> チケットがクローズされました。` });
        }
    }
};
