import {
    type AuthStatus,
    DEFAULT_DOT_COM_MODELS,
    ModelUsage,
    ModelProvider,
} from '@sourcegraph/cody-shared'
import * as vscode from 'vscode'

export const CHAT_INPUT_TOKEN_BUDGET = 7000
export const ANSWER_TOKENS = 1000

/**
 * Sets the model providers based on the authentication status.
 *
 * If a chat model is configured to overwrite, it will add a model provider for that model.
 * The token limit for the provider will use the configured limit,
 * or fallback to the limit from the authentication status if not configured.
 */
export function syncModelProviders(authStatus: AuthStatus): void {
    ModelProvider.setProviders(DEFAULT_DOT_COM_MODELS)
}

interface ChatModelProviderConfig {
    provider: string
    model: string
    inputTokens?: number
    outputTokens?: number
    apiKey?: string
    apiEndpoint?: string
}

/**
 * NOTE: DotCom Connections only as model options are not available for Enterprise
 *
 * Gets an array of `ModelProvider` instances based on the configuration for dev chat models.
 * If the `cody.dev.models` setting is not configured or is empty, the function returns an empty array.
 *
 * @returns An array of `ModelProvider` instances for the configured chat models.
 */
export function getChatModelsFromConfiguration(): ModelProvider[] {
    const codyConfig = vscode.workspace.getConfiguration('cody')
    const modelsConfig = codyConfig?.get<ChatModelProviderConfig[]>('dev.models')
    if (!modelsConfig?.length) {
        return []
    }

    const providers: ModelProvider[] = []
    for (const m of modelsConfig) {
        const provider = new ModelProvider(
            `${m.provider}/${m.model}`,
            [ModelUsage.Chat, ModelUsage.Edit],
            // This is buggy, fix later
            CHAT_INPUT_TOKEN_BUDGET)
        provider.codyProOnly = true
        providers.push(provider)
    }

    ModelProvider.addProviders(providers)
    return providers
}
