import * as uuid from 'uuid'
import type { Memento } from 'vscode'

import { DOTCOM_URL, type AuthStatus, type ChatHistory, type UserLocalHistory } from '@sourcegraph/cody-shared'

import { isSourcegraphToken } from '../chat/protocol'

type ChatHistoryKey = `${string}-${string}`
type AccountKeyedChatHistory = {
    [key: ChatHistoryKey]: PersistedUserLocalHistory
}

interface PersistedUserLocalHistory {
    chat: ChatHistory
}

class LocalStorage {
    // Bump this on storage changes so we don't handle incorrectly formatted data
    protected readonly KEY_LOCAL_HISTORY = 'cody-local-chatHistory-v2'
    public readonly ANONYMOUS_USER_ID_KEY = 'sourcegraphAnonymousUid'
    public readonly LAST_USED_ENDPOINT = 'SOURCEGRAPH_CODY_ENDPOINT'
    protected readonly CODY_ENDPOINT_HISTORY = 'SOURCEGRAPH_CODY_ENDPOINT_HISTORY'
    protected readonly CODY_ENROLLMENT_HISTORY = 'SOURCEGRAPH_CODY_ENROLLMENTS'

    /**
     * Should be set on extension activation via `localStorage.setStorage(context.globalState)`
     * Done to avoid passing the local storage around as a parameter and instead
     * access it as a singleton via the module import.
     */
    private _storage: Memento | null = null

    private get storage(): Memento {
        if (!this._storage) {
            throw new Error('LocalStorage not initialized')
        }

        return this._storage
    }

    public setStorage(storage: Memento): void {
        this._storage = storage
    }

    public getEndpoint(): string | null {
        return DOTCOM_URL.href
    }

    public async saveEndpoint(endpoint: string): Promise<void> {
        if (!endpoint) {
            return
        }
        try {
            // Do not save sourcegraph tokens as the last used endpoint
            if (isSourcegraphToken(endpoint)) {
                return
            }

            const uri = new URL(endpoint).href
            await this.storage.update(this.LAST_USED_ENDPOINT, uri)
            await this.addEndpointHistory(uri)
        } catch (error) {
            console.error(error)
        }
    }

    public async deleteEndpoint(): Promise<void> {
        await this.storage.update(this.LAST_USED_ENDPOINT, null)
    }

    public getEndpointHistory(): string[] | null {
        return this.storage.get<string[] | null>(this.CODY_ENDPOINT_HISTORY, null)
    }

    private async addEndpointHistory(endpoint: string): Promise<void> {
        // Do not save sourcegraph tokens as endpoint
        if (isSourcegraphToken(endpoint)) {
            return
        }

        const history = this.storage.get<string[] | null>(this.CODY_ENDPOINT_HISTORY, null)
        const historySet = new Set(history)
        historySet.delete(endpoint)
        historySet.add(endpoint)
        await this.storage.update(this.CODY_ENDPOINT_HISTORY, [...historySet])
    }

    public getChatHistory(authStatus: AuthStatus): UserLocalHistory {
        const history = this.storage.get<AccountKeyedChatHistory | null>(this.KEY_LOCAL_HISTORY, null)
        const accountKey = getKeyForAuthStatus(authStatus)
        return history?.[accountKey] ?? { chat: {} }
    }

    public async setChatHistory(authStatus: AuthStatus, history: UserLocalHistory): Promise<void> {
        try {
            const key = getKeyForAuthStatus(authStatus)
            let fullHistory = this.storage.get<{ [key: ChatHistoryKey]: UserLocalHistory } | null>(
                this.KEY_LOCAL_HISTORY,
                null
            )

            if (fullHistory) {
                fullHistory[key] = history
            } else {
                fullHistory = {
                    [key]: history,
                }
            }

            await this.storage.update(this.KEY_LOCAL_HISTORY, fullHistory)
        } catch (error) {
            console.error(error)
        }
    }

    public async deleteChatHistory(authStatus: AuthStatus, chatID: string): Promise<void> {
        const userHistory = this.getChatHistory(authStatus)
        if (userHistory) {
            try {
                delete userHistory.chat[chatID]
                await this.setChatHistory(authStatus, userHistory)
            } catch (error) {
                console.error(error)
            }
        }
    }

    public async removeChatHistory(authStatus: AuthStatus): Promise<void> {
        try {
            await this.setChatHistory(authStatus, { chat: {} })
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * Gets the enrollment history for a feature from the storage.
     *
     * Checks if the given feature name exists in the stored enrollment
     * history array.
     *
     * If not, add the feature to the memory, but return false after adding the feature
     * so that the caller can log the first enrollment event.
     */
    public getEnrollmentHistory(featureName: string): boolean {
        const history = this.storage.get<string[]>(this.CODY_ENROLLMENT_HISTORY, [])
        const hasEnrolled = history.includes(featureName)
        // Log the first enrollment event
        if (!hasEnrolled) {
            history.push(featureName)
            this.storage.update(this.CODY_ENROLLMENT_HISTORY, history)
        }
        return hasEnrolled
    }

    /**
     * Return the anonymous user ID stored in local storage or create one if none exists (which
     * occurs on a fresh installation).
     */
    public async anonymousUserID(): Promise<{ anonymousUserID: string; created: boolean }> {
        let id = this.storage.get<string>(this.ANONYMOUS_USER_ID_KEY)
        let created = false
        if (!id) {
            created = true
            id = uuid.v4()
            try {
                await this.storage.update(this.ANONYMOUS_USER_ID_KEY, id)
            } catch (error) {
                console.error(error)
            }
        }
        return { anonymousUserID: id, created }
    }

    public get(key: string): string | null {
        return this.storage.get(key, null)
    }

    public async set(key: string, value: string): Promise<void> {
        try {
            await this.storage.update(key, value)
        } catch (error) {
            console.error(error)
        }
    }

    public async delete(key: string): Promise<void> {
        await this.storage.update(key, undefined)
    }
}

/**
 * Singleton instance of the local storage provider.
 * The underlying storage is set on extension activation via `localStorage.setStorage(context.globalState)`.
 */
export const localStorage = new LocalStorage()

function getKeyForAuthStatus(authStatus: AuthStatus): ChatHistoryKey {
    return `${authStatus.endpoint}-${authStatus.username}`
}
