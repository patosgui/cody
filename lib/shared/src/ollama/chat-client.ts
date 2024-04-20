import { ChatMistralAI } from "@langchain/mistralai";
import { ChatOllama } from "@langchain/community/chat_models/ollama";

import type {
    CompletionCallbacks,
    CompletionParameters,
    Message,
} from '../sourcegraph-api/completions/types'

/**
 * Based on https://www.npmjs.com/package/@langchain/mistralai?activeTab=readme
 */
export const run = async (messages: Message[], cb: CompletionCallbacks,) => {
};

/**
 * Calls the Ollama API for chat completions with history.
 *
 * Doc: https://github.com/ollama/ollama/blob/main/docs/api.md#chat-request-with-history
 */
export const mistralChatClient = async(
    params: CompletionParameters,
    cb: CompletionCallbacks,
) => {
    const model = new ChatMistralAI({
        apiKey: process.env.MISTRAL_API_KEY,
        modelName: "open-mixtral-8x22b",
    });
    // Check later: https://medium.com/@2018.itsuki/implement-langchain-conversationsummarybuffermemory-in-next-js-using-typescript-b956a15e4103
    
    let prompt = params.messages.map(
            message =>
                `${message.speaker}: ${
                    message.text === undefined ? '' : message.text
                }\n`
        )
        .join('')
    
    console.log("------ Interaction (mistral) ------");
    console.log("------ Question");
    console.log(prompt);

    const stream = await model.stream(prompt);

    let bufferText = ""
    for await (const chunk of stream) {
        let chunkText = chunk.lc_kwargs.content;
        bufferText += chunkText;
        cb.onChange(bufferText)
    }

    console.log("------ Answer");
    console.log(bufferText);

    cb.onComplete()
}

export const ollamaChatClient = async(
    params: CompletionParameters,
    cb: CompletionCallbacks,
) => {
    const model = new ChatOllama({
        baseUrl: "http://localhost:11434", // Default value
        model: "llama3", // Default value
    });
    
    let prompt = params.messages.map(
            message =>
                `${message.speaker}: ${
                    message.text === undefined ? '' : message.text
                }\n`
        )
        .join('')
    
    console.log("------ Interaction (llama3) ------");
    console.log("------ Question");
    console.log(prompt);

    const stream = await model.stream(prompt);

    let bufferText = ""
    for await (const chunk of stream) {
        let chunkText = chunk.lc_kwargs.content;
        bufferText += chunkText;
        cb.onChange(bufferText)
    }

    console.log("------ Answer");
    console.log(bufferText);

    cb.onComplete()
}