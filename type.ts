import type {
    Awaitable,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Collection,
    Message,
    ModalSubmitInteraction,
    RESTPostAPIChatInputApplicationCommandsJSONBody
} from "discord.js";

export interface reloadAnyTypeCommandsFunctionType<T extends { data: { name: string } }> {
    (commandDirPath: string, ommandsCollection: Collection<string, T>): void;
}

export interface Interaction {
    data: RESTPostAPIChatInputApplicationCommandsJSONBody;
    handler: (interaction: ChatInputCommandInteraction) => Awaitable<void>;
    modalHandler: (interaction: ModalSubmitInteraction) => Awaitable<void>;
    buttonHandler: (Interaction: ButtonInteraction) => Awaitable<void>;
}

export interface MessageCommand {
    data: {
        name: string;
    };
    handler: (message: Message) => Awaitable<void>;
}
