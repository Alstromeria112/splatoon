// @ts-check

const { EmbedBuilder } = require("discord.js");
const { getEnv } = require("../../../util");
const { inspect } = require("node:util");

/** @type {import("../../../type").MessageCommand} */
module.exports = {
    data: {
        name: "run"
    },
    handler: async message => {
        if (message.author.id !== getEnv("OWNER_ID")) return;
        const content = message.content;
        if (content.includes("```js") && content.endsWith("```")) {
            const codeBlock = content.match(/```js([\s\S]*)```/);
            if (!codeBlock || codeBlock.length < 2) {
                const embed = new EmbedBuilder()
                    .setTitle(getEnv("ERROR"))
                    .setDescription(`\`\`\`codeblock is not match\`\`\``)
                    .setColor("#ff0000")
                    .setFooter({ text: getEnv("POWERED"), iconURL: getEnv("ICON_URL") });
                return message.reply({ embeds: [embed] });
            }
            const code = codeBlock[1].trim();

            const captureConsole = () => {
                const logs = [];
                const originalLog = console.log;
                console.log = (...args) => {
                    const inspectedArgs = args.map(arg =>
                        typeof arg === "object" ? require("util").inspect(arg, { depth: 3 }) : arg
                    );
                    logs.push(inspectedArgs.join(" "));
                    originalLog.apply(console, inspectedArgs);
                };
                return {
                    logs,
                    restore: () => (console.log = originalLog)
                };
            };
            const capture = captureConsole();
            try {
                const result = await eval(`(async () => { ${code} })()`);
                capture.restore();

                const logs = capture.logs.join("\n");
                message.reply(`\`\`\`js\n${logs}\n\`\`\``);
            } catch (error) {
                capture.restore();
                message.reply(`\`\`\`js\n${error.message}\n\`\`\``);
            }
        }
    }
};
