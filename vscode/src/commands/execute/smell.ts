import {
    type ContextItem,
    DefaultChatCommands,
    PromptString,
    displayLineRange,
    logDebug,
    ps,
    wrapInActiveSpan,
} from '@sourcegraph/cody-shared'
import { defaultCommands } from '.'
import type { ChatCommandResult } from '../../main'
import { telemetryService } from '../../services/telemetry'
import { telemetryRecorder } from '../../services/telemetry-v2'
import { getContextFileFromCursor } from '../context/selection'
import type { CodyCommandArgs } from '../types'
import { type ExecuteChatArguments, executeChat } from './ask'

import type { Span } from '@opentelemetry/api'

/**
 * Generates the prompt and context files with arguments for the 'smell' command.
 *
 * Context: Current selection
 */
async function smellCommand(span: Span, args?: Partial<CodyCommandArgs>): Promise<ExecuteChatArguments> {
    const addEnhancedContext = false
    let prompt = PromptString.fromDefaultCommands(defaultCommands, 'smell')

    if (args?.additionalInstruction) {
        span.addEvent('additionalInstruction')
        prompt = ps`${prompt} ${args.additionalInstruction}`
    }

    const contextFiles: ContextItem[] = []

    const currentSelection = await getContextFileFromCursor()
    contextFiles.push(...currentSelection)

    const cs = currentSelection[0]
    if (cs) {
        const range = cs.range && ps`:${displayLineRange(cs.range)}`
        prompt = prompt.replaceAll(
            'the selected code',
            ps`@${PromptString.fromDisplayPath(cs.uri)}${range ?? ''} `
        )
    }

    return {
        text: prompt,
        submitType: 'user-newchat',
        contextFiles,
        addEnhancedContext,
        source: args?.source,
        command: DefaultChatCommands.Smell,
    }
}

/**
 * Executes the smell command as a chat command via 'cody.action.chat'
 */
export async function executeSmellCommand(
    args?: Partial<CodyCommandArgs>
): Promise<ChatCommandResult | undefined> {
    return wrapInActiveSpan('command.smell', async span => {
        span.setAttribute('sampled', true)
        logDebug('executeSmellCommand', 'executing', { args })
        telemetryService.log('CodyVSCodeExtension:command:smell:executed', {
            useCodebaseContex: false,
            requestID: args?.requestID,
            source: args?.source,
            traceId: span.spanContext().traceId,
        })
        telemetryRecorder.recordEvent('cody.command.smell', 'executed', {
            metadata: {
                useCodebaseContex: 0,
            },
            interactionID: args?.requestID,
            privateMetadata: {
                requestID: args?.requestID,
                source: args?.source,
                traceId: span.spanContext().traceId,
            },
        })

        return {
            type: 'chat',
            session: await executeChat(await smellCommand(span, args)),
        }
    })
}
