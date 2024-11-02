// @ts-check

"use strict";

const {
    createAudioPlayer,
    AudioPlayerStatus,
    joinVoiceChannel,
    createAudioResource,
    StreamType,
    getVoiceConnection,
    getVoiceConnections: getAllVoiceConnections
} = require("@discordjs/voice");
const ytdl = require("@distube/ytdl-core");
const ytsr = require("@distube/ytsr");
const { moduleDispose } = require("../commands-manager.js");

const privateSymbol = Symbol();

/**
 * @param {string} maybeUrl
 */
function tryParseAsURL(maybeUrl) {
    try {
        return new URL(maybeUrl);
    } catch (_) {
        return void 0;
    }
}

class ParsedMusicInfo {
    /**
     * @private Cannot be invoked directly
     * @param {symbol} privSym
     * @param {string} url
     * @param {string} name
     * @param {string | undefined} thumbnail
     * @param {string | undefined} authorUrl
     * @param {string | undefined} authorName
     * @param {string | undefined} authorIcon
     */
    constructor(privSym, url, name, thumbnail, authorUrl, authorName, authorIcon) {
        if (privSym !== privateSymbol) throw new TypeError("Cannot be invoked directly");
        this.#videoUrl = url;
        this.#videoName = name;
        this.#videoThumbnailUrl = thumbnail ?? "";
        this.#channelUrl = authorUrl ?? "";
        this.#channelName = authorName ?? "";
        this.#channelIconUrl = authorIcon ?? "";
    }

    /** @type {string} */
    #videoUrl;
    get videoUrl() {
        return this.#videoUrl;
    }

    /** @type {string} */
    #channelUrl;
    get channelUrl() {
        return this.#channelUrl;
    }

    /** @type {string} */
    #videoName;
    get videoName() {
        return this.#videoName;
    }

    /** @type {string} */
    #videoThumbnailUrl;
    get videoThumbnailUrl() {
        return this.#videoThumbnailUrl;
    }

    /** @type {string} */
    #channelName;
    get channelName() {
        return this.#channelName;
    }

    /** @type {string} */
    #channelIconUrl;
    get channelIconUrl() {
        return this.#channelIconUrl;
    }

    get title() {
        return `${this.videoName} | ${this.channelName}`;
    }

    /**
     * @param {string} query
     * @returns {Promise<ParsedMusicInfo>}
     */
    static async create(query) {
        const isUrl = !!tryParseAsURL(query.trim());
        async function requestYtdl(url) {
            const result = await ytdl.getInfo(url);
            return {
                url: result.videoDetails.video_url,
                name: result.videoDetails.title,
                thumbnail: result.videoDetails.thumbnails.at(-1)?.url ?? void 0,
                authorUrl: result.videoDetails.author.channel_url,
                authorName: result.videoDetails.author.name,
                authorIcon: result.videoDetails.author.thumbnails?.at(-1)?.url ?? void 0
            };
        }
        async function requestYtsr(query) {
            const ytsrResult = await ytsr(query);
            const video = /** @type {ytsr.Video} */ (ytsrResult.items.find(res => res.type === "video"));
            return {
                url: video.url,
                name: video.name,
                thumbnail: video.thumbnail ?? void 0,
                authorUrl: video.author?.url ?? void 0,
                authorName: video.author?.name ?? void 0,
                authorIcon: video.author?.bestAvatar?.url ?? void 0
            };
        }
        const { url, name, thumbnail, authorUrl, authorName, authorIcon } = await (isUrl ? requestYtdl : requestYtsr)(
            query
        );
        return new ParsedMusicInfo(privateSymbol, url, name, thumbnail, authorUrl, authorName, authorIcon);
    }
}

exports.ParsedMusicInfo = ParsedMusicInfo;

/** @type {WeakMap<import("@discordjs/voice").VoiceConnection, GuildMusicQueue>} */
let vcMap = new WeakMap();

/**
 * @param {import("@discordjs/voice").VoiceConnection} connection
 * @return {GuildMusicQueue}
 */
function getOrCreateQueueByVoiceConnection(connection) {
    if (vcMap.has(connection)) return /** @type {GuildMusicQueue} */ (vcMap.get(connection));
    const queue = new GuildMusicQueue(connection);
    vcMap.set(connection, queue);
    return queue;
}

/**
 * Represents a music queue for a guild.
 */
class GuildMusicQueue {
    /** @type {import("@discordjs/voice").VoiceConnection} */
    #connection;
    /** @type {import("@discordjs/voice").AudioPlayer} */
    #player;
    /** @type {ParsedMusicInfo[]} */
    #requests = [];
    #history = [];
    #originalOrder = [];
    #allRequests = [];
    #originalQueue = [];
    /** @type {import("prism-media").VolumeTransformer | null} */
    #volumeTransformer = null;

    #loop = false;
    #loopSingle = false;
    #currentRequest = /** @type {ParsedMusicInfo | null} */ (null);

    /**
     * @param {import("@discordjs/voice").VoiceConnection} connection
     */
    constructor(connection) {
        if (new.target !== GuildMusicQueue) throw new TypeError("Seal class");
        this.#connection = connection;
        this.#player = createAudioPlayer();
        connection.subscribe(this.#player);
        this.#player.on(AudioPlayerStatus.Idle, () => this.#processQueuedRequest());
        this.#history = [];
    }

    get voiceChannelId() {
        return /** @type {string} */ (this.#connection.joinConfig.channelId);
    }

    /** @param {ParsedMusicInfo} req */
    addRequest(req) {
        this.#requests.push(req);
        this.#allRequests.push(req);
        this.#originalQueue.push(req);
        this.#allRequests = this.#shuffle(this.#allRequests);
        const { status } = this.#player.state;
        if (status === AudioPlayerStatus.Idle) this.#processQueuedRequest();
    }

    getQueue() {
        return this.#requests;
    }

    skipOne() {
        this.#player.stop();
    }

    pause() {
        this.#player.pause();
    }

    unpause() {
        this.#player.unpause();
    }

    jump(number) {
        const skip = Math.max(0, Math.floor(number) - 1);
        this.#requests.splice(0, skip);
        this.#player.stop();
    }

    unjump(number) {
        const unskip = Math.max(0, Math.floor(number) - 1);
        const history = this.#history.slice(-unskip);
        this.#requests.unshift(...history);
        this.#player.stop();
    }

    shuffle() {
        this.#originalOrder = [...this.#requests];
        for (let i = this.#requests.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.#requests[i], this.#requests[j]] = [this.#requests[j], this.#requests[i]];
        }
    }

    #shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    unshuffle() {
        this.#requests = [...this.#originalOrder];
    }

    toggleLoop() {
        this.#loop = !this.#loop;
        if (this.#loop) {
            this.#originalQueue = [...this.#requests];
        }
    }

    destroy() {
        this.#requests.length = 0;
        this.#player.stop(true);
        this.#connection.destroy();
    }

    /**
     * Set the volume of the player.
     * @param {number} volume - The volume percentage (0-100).
     */
    setVolume(volume) {
        if (this.#volumeTransformer) {
            this.#volumeTransformer.setVolume(volume / 100);
        }
    }

    #processQueuedRequest(startTime = 0) {
        if (!this.#requests.length) return;

        const nextReq = /** @type {ParsedMusicInfo} */ (this.#requests.shift());
        if (!nextReq) return;
        this.#currentRequest = nextReq;
        this.#history.push(nextReq);
        const stream = ytdl(nextReq.videoUrl, {
            filter: format => format.audioCodec === "opus" && format.container === "webm",
            quality: "highest",
            begin: startTime,
            highWaterMark: 32 * 1024 * 1024 // https://github.com/fent/node-ytdl-core/issues/902
        });
        const resource = createAudioResource(stream, {
            inputType: StreamType.WebmOpus,
            inlineVolume: true
        });

        this.#volumeTransformer = /** @type {import("prism-media").VolumeTransformer} */ (resource.volume);
        this.#volumeTransformer.setVolume(5 / 100);

        this.#player.play(resource);
        this.#player.once(AudioPlayerStatus.Idle, () => {
            if (this.#loop) {
                this.#requests = [...this.#originalQueue];
            } else if (this.#loopSingle) {
                this.#requests.unshift(nextReq);
            }
            this.#processQueuedRequest();
        });
    }

    /**
     * @param {string} guildId
     * @return {GuildMusicQueue | void}
     */
    static get(guildId) {
        const connection = getVoiceConnection(guildId);
        if (!connection) return;
        return vcMap.get(connection);
    }

    /**
     * @param {import("discord.js").BaseGuildVoiceChannel} voiceChannel
     * @return {GuildMusicQueue}
     */
    static getOrCreate(voiceChannel) {
        const connection = joinVoiceChannel({
            // @ts-ignore
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            channelId: voiceChannel.id,
            guildId: voiceChannel.guildId,
            selfDeaf: true,
            selfMute: false
        });
        return getOrCreateQueueByVoiceConnection(connection);
    }
}

exports.GuildMusicQueue = GuildMusicQueue;

/**
 * Module Finalizer
 */
exports[moduleDispose] = () => {
    for (const voiceConnection of getAllVoiceConnections().values()) {
        vcMap.get(voiceConnection)?.destroy();
    }
    vcMap = new WeakMap();
};
