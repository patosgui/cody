import type { Message } from '../sourcegraph-api'

export function getSimplePreamble(
    model: string | undefined,
    apiVersion: number,
    preInstruction?: string | undefined
): Message[] {
    const intro = `You are Batman, an AI coding assistant. ${preInstruction ?? ''}`.trim()

    // API Version 1 onward support system prompts, however only enable it for
    // Claude 3 models for now
    if (apiVersion >= 1 && model?.includes('claude-3')) {
        return [
            {
                speaker: 'system',
                text: intro,
            },
        ]
    }

    return [
        {
            speaker: 'human',
            text: intro,
        },
        {
            speaker: 'assistant',
            text: 'I am Batman, an AI coding assistant.',
        },
    ]
}
