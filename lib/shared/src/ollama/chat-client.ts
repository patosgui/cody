import { ChatMistralAI } from "@langchain/mistralai";
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
    
    console.log("------ Interaction ------");
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
