// @ts-check

"use strict";

/**
 * @param {string} name
 * @returns {string}
 */
function getEnv(name) {
    const value = process.env[name];
    if (typeof value !== "string") {
        console.log(`[ ERROR ] ${name} is not present in \`.env\`. exiting...`);
        process.exit(1);
    }
    return value;
}
exports.getEnv = getEnv;

/**
 * @param {Date | undefined} date
 * @returns {string}
 */
function getDateString(date = new Date()) {
    return (
        `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ` +
        `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    );
}
exports.getDateString = getDateString;
