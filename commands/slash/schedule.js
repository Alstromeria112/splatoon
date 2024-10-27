// @ts-check

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { default: axios } = require("axios");
const { getEnv } = require("../../util");

const modes = {
    1: "regular",
    2: "bankara-open",
    3: "bankara-challenge",
    4: "fest",
    5: "fest-challenge",
    6: "x",
    7: "event",
    8: "coop-grouping"
};

const modeName = {
    1: "レギュラーマッチ",
    2: "バンカラマッチ(オープン)",
    3: "バンカラマッチ(チャレンジ)",
    4: "フェスマッチ(オープン)",
    5: "フェスマッチ(チャレンジ)",
    6: "Xマッチ",
    7: "イベントマッチ"
};

const nn = {
    now: "今",
    next: "次"
};

/** @type {import("../../type").SlashCommand} */
module.exports = {
    data: new SlashCommandBuilder()
        .setName("schedule")
        .setDescription("スケジュールを取得します")
        .addSubcommand(subcommand =>
            subcommand
                .setName("now")
                .setDescription("今のスケジュールを取得します。")
                .addIntegerOption(option =>
                    option
                        .setName("type")
                        .setDescription("取得したいスケジュールタイプを選択してください。")
                        .setChoices([
                            { name: "レギュラーマッチ", value: 1 },
                            { name: "バンカラマッチ(オープン)", value: 2 },
                            { name: "バンカラマッチ(チャレンジ)", value: 3 },
                            { name: "フェスマッチ(オープン)", value: 4 },
                            { name: "フェスマッチ(チャレンジ)", value: 5 },
                            { name: "Xマッチ", value: 6 },
                            { name: "イベントマッチ", value: 7 },
                            { name: "サーモンラン", value: 8 }
                        ])
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("next")
                .setDescription("次のスケジュールを取得します。")
                .addIntegerOption(option =>
                    option
                        .setName("type")
                        .setDescription("取得したいスケジュールタイプを選択してください。")
                        .setChoices([
                            { name: "レギュラーマッチ", value: 1 },
                            { name: "バンカラマッチ(オープン)", value: 2 },
                            { name: "バンカラマッチ(チャレンジ)", value: 3 },
                            { name: "フェスマッチ(オープン)", value: 4 },
                            { name: "フェスマッチ(チャレンジ)", value: 5 },
                            { name: "Xマッチ", value: 6 },
                            { name: "イベントマッチ", value: 7 },
                            { name: "サーモンラン", value: 8 }
                        ])
                        .setRequired(true)
                )
        )
        .toJSON(),
    handler: async interaction => {
        if (!interaction.isChatInputCommand()) return;
        const type = interaction.options.getSubcommand();
        const mode = interaction.options.getInteger("type", true);
        if (mode === 8) {
            const embed = await getSalmonRunSchedule(type);
            return interaction.reply({ embeds: embed });
        } else {
            const embed = await getBattleSchedule(type, mode);
            return interaction.reply({ embeds: embed });
        }
    }
};

/**
 * @param {String} type
 * @param {Number} mode
 * @returns
 */
async function getBattleSchedule(type, mode) {
    try {
        const response = await axios.get(`https://spla3.yuu26.com/api/${modes[mode]}/${type}`, {
            method: "GET",
            headers: {
                "User-Agent": "Splatoon/0.1(twitter@alstromeria112)"
            }
        });
        const schedule = response.data.results[0];
        if (mode != 4 && mode != 5 && schedule.is_fest === true) {
            const embed = [
                new EmbedBuilder().setTitle(getEnv("ERROR")).setDescription("フェスが開催中です").setColor("Red")
            ];
            return embed;
        }
        const startTime = Math.floor(new Date(schedule.start_time).getTime() / 1000);
        const endTime = Math.floor(new Date(schedule.end_time).getTime() / 1000);
        const ruleName = schedule.rule.name;
        const stages = schedule.stages.map(stage => {
            return {
                name: stage.name,
                image: stage.image
            };
        });

        const embed = [
            new EmbedBuilder()
                .setColor(0x0099ff)
                .setDescription(
                    `### ${nn[type]}の${modeName[mode]}スケジュール\nルール: **${ruleName}**\n開始: <t:${startTime}:F>\n終了: <t:${endTime}:F>\n\n**${stages[0].name}** / **${stages[1].name}**`
                )
                .setImage(stages[0].image),
            new EmbedBuilder().setImage(stages[1].image).setColor("#0099ff").setTimestamp()
        ];

        return embed;
    } catch (e) {
        console.error("Error fetching schedule:", e);
        const embed = [new EmbedBuilder().setTitle(getEnv("ERROR")).setDescription(e.message).setColor("Red")];
        return embed;
    }
}

async function getSalmonRunSchedule(type) {
    try {
        const response = await axios.get(`https://spla3.yuu26.com/api/coop-grouping/${type}`, {
            method: "GET",
            headers: {
                "User-Agent": "Splatoon/0.1(twitter@alstromeria112)"
            }
        });
        const schedule = response.data.results[0];
        const startTime = Math.floor(new Date(schedule.start_time).getTime() / 1000);
        const endTime = Math.floor(new Date(schedule.end_time).getTime() / 1000);
        const bossName = schedule.boss.name;
        const stage = schedule.stage.name;
        const stageImage = schedule.stage.image;
        const weapons = schedule.weapons.map(weapon => {
            return {
                name: weapon.name,
                image: weapon.image
            };
        });

        const embed = [
            new EmbedBuilder()
                .setColor("#ffa500")
                .setDescription(
                    `### ${nn[type]}のサーモンランスケジュール\nステージ: **${stage}**\nボス: **${bossName}**\n開始: <t:${startTime}:F>\n終了: <t:${endTime}:F>\n\n**${weapons[0].name}** / **${weapons[1].name}**\n**${weapons[2].name}** / **${weapons[3].name}**`
                )
                .setImage(stageImage),
            new EmbedBuilder()
                .setURL("https://alstromeria.net/")
                .setColor("#ffa500")
                .setImage(weapons[0].image)
                .setTimestamp(),
            new EmbedBuilder().setURL("https://alstromeria.net/").setImage(weapons[1].image),
            new EmbedBuilder().setURL("https://alstromeria.net/").setImage(weapons[2].image),
            new EmbedBuilder().setURL("https://alstromeria.net/").setImage(weapons[3].image)
        ];
        return embed;
    } catch (e) {
        const embed = [new EmbedBuilder().setTitle(getEnv("ERROR")).setDescription(e.message).setColor("Red")];
        return embed;
    }
}
