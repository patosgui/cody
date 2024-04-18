import { ChatMistralAI } from "@langchain/mistralai";
import { type OllamaChatParams } from '.'
import type {
    CompletionCallbacks,
    CompletionParameters,
    Message,
} from '../sourcegraph-api/completions/types'
import { logDebug } from '../../src/logger'

/**
 * Based on https://www.npmjs.com/package/@langchain/mistralai?activeTab=readme
 */
export const run = async (messages: Message[], cb: CompletionCallbacks,) => {
    const model = new ChatMistralAI({
        //apiKey: process.env.MISTRAL_API_KEY,
        apiKey: "J8GSYWRHoApL1R30TOcrvffjsV0mmZG9",
        modelName: "mistral-small",
    });
    // Check later: https://medium.com/@2018.itsuki/implement-langchain-conversationsummarybuffermemory-in-next-js-using-typescript-b956a15e4103
    
    let prompt = messages.map(
            message =>
                `${message.speaker}: ${
                    message.text === undefined ? '' : message.text
                }\n`
        )
        .join('')
    

    
    console.log("------Question------");
    console.log(prompt);

    const stream = await model.stream(prompt);

    let bufferText = ""
    for await (const chunk of stream) {
        let chunkText = chunk.lc_kwargs.content;
        bufferText += chunkText;
        cb.onChange(bufferText)
    }

    console.log(bufferText);
    console.log("------Answer------");

    cb.onComplete()
};

/**
 * Calls the Ollama API for chat completions with history.
 *
 * Doc: https://github.com/ollama/ollama/blob/main/docs/api.md#chat-request-with-history
 */
export function ollamaChatClient(
    params: CompletionParameters,
    cb: CompletionCallbacks,
): void {
    //const log = logger?.startCompletion(params, completionsEndpoint)
    const model = params.model?.replace('ollama/', '')
    if (!model || !params.messages) {
        //log?.onError('No model or messages')
        throw new Error('No model or messages')
    }

    const ollamaChatParams = {
        model,
        messages: params.messages.map(msg => {
            return {
                role: msg.speaker === 'human' ? 'user' : 'assistant',
                content: msg.text ?? '',
            }
        }),
        options: {
            temperature: params.temperature,
            top_k: params.topK,
            top_p: params.topP,
            tfs_z: params.maxTokensToSample,
        },
    } satisfies OllamaChatParams


    logDebug("ollamaChatClient",
            "ollamaChatClient",
            JSON.stringify(ollamaChatParams, null, 2))

    //let prompt = ollamaChatParams.messages.join("\n")

    run(params.messages, cb);

    // Sends the completion parameters and callbacks to the Ollama API.
    //fetch(new URL('/api/chat', OLLAMA_DEFAULT_URL).href, {
    //    method: 'POST',
    //    body: JSON.stringify(ollamaChatParams),
    //    headers: {
    //        'Content-Type': 'application/json',
    //    },
    //    signal,
    //}).then(async response => {
    //    if (!response.body) {
    //        //log?.onError('No response body')
    //        throw new Error('No response body')
    //    }

    //    const reader = response.body.getReader()

    //    onAbort(signal, () => reader.cancel())

    //    // Handles the response stream to accumulate the full completion text.“
    //    let insertText = ''
    //    while (true) {
    //        const { done, value } = await reader.read()
    //        if (done) {
    //            cb.onComplete()
    //            break
    //        }

    //        const textDecoder = new TextDecoder()
    //        const decoded = textDecoder.decode(value, { stream: true })
    //        const parsedLine = JSON.parse(decoded) as OllamaGenerateResponse

    //        if (parsedLine.message) {
    //            insertText += parsedLine.message.content
    //            cb.onChange(insertText)
    //        }
    //    }

    //    //const completionResponse: CompletionResponse = {
    //    //    completion: insertText,
    //    //    stopReason: CompletionStopReason.RequestFinished,
    //    //}
    //    //log?.onComplete(completionResponse)
    //})
}
