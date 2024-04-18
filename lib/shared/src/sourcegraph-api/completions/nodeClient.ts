
import { ollamaChatClient } from '../../ollama/chat-client'
import { SourcegraphCompletionsClient } from './client'
import type { CompletionCallbacks, CompletionParameters } from './types'


export class SourcegraphNodeCompletionsClient extends SourcegraphCompletionsClient {
    protected _streamWithCallbacks(
        params: CompletionParameters,
        _apiVersion: number,
        cb: CompletionCallbacks,
        _signal?: AbortSignal
    ): void {
    ollamaChatClient(params, cb)
    }
}