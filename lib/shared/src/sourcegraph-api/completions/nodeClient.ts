
import { mistralChatClient, ollamaChatClient} from '../../ollama/chat-client'
import { SourcegraphCompletionsClient } from './client'
import type { CompletionCallbacks, CompletionParameters } from './types'


export class SourcegraphNodeCompletionsClient extends SourcegraphCompletionsClient {
    protected _streamWithCallbacks(
        params: CompletionParameters,
        _apiVersion: number,
        cb: CompletionCallbacks,
        _signal?: AbortSignal
    ): void {
        if (params.model?.includes('mixtral-8x22B-instruct')) {
            mistralChatClient(params, cb)
        } else {
            ollamaChatClient(params, cb)
        }
    }
}