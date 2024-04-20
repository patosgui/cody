import type { ModelProvider } from '.'
import { DEFAULT_CHAT_MODEL_TOKEN_LIMIT} from '../prompt/constants'
import { ModelUsage } from './types'

// The models must first be added to the custom chat models list in https://sourcegraph.com/github.com/sourcegraph/sourcegraph/-/blob/internal/completions/httpapi/chat.go?L48-51
export const DEFAULT_DOT_COM_MODELS = [
    {
        title: 'Mixtral 8x22B',
        model: 'mixtral-8x22B-instruct',
        provider: 'Mistral',
        default: true,
        codyProOnly: false,
        // TODO: Improve prompt for Mixtral + Edit to see if we can use it there too.
        usage: [ModelUsage.Chat],
        maxToken: DEFAULT_CHAT_MODEL_TOKEN_LIMIT,
    },
    {
        title: 'Llama 3 (Ollama)',
        // easter egg, just kidding. But can't put "ollama" here since there is
        // some check down the line that breaks support for llama
        model: 'anthropic/claude-2.0',
        provider: 'Ollama',
        default: true,
        codyProOnly: false,
        // TODO: Improve prompt for Mixtral + Edit to see if we can use it there too.
        usage: [ModelUsage.Chat],
        maxToken: DEFAULT_CHAT_MODEL_TOKEN_LIMIT,
    },
] as const satisfies ModelProvider[]
