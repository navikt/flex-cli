import sodium from 'libsodium-wrappers'
import prompts from 'prompts'

import { config } from '../config/config'
import { RepoConfig } from '../config/types'
import { log } from '../common/log.ts'

import { octokit } from './octokit'

export async function secrets() {
    const choices = ['FLEX_GITHUB_FEED_WEBHOOK', 'LABS_DEPLOY_WEBHOOK', 'SPOKELSER_WEBHOOK'].map((choice) => {
        return { title: choice, value: choice }
    })

    const response = await prompts([
        {
            type: 'autocompleteMultiselect',
            name: 'secrets',
            message: 'Hvilke secrets skal opprettes eller oppdateres?',
            choices,
        },
    ])

    if (!response.secrets || response.secrets.length == 0) {
        log('Ingen secrets valgt')
        process.exit()
    }

    for (const repo of config.repos) {
        for (const secretName of response.secrets) {
            const plainTextSecret = process.env[secretName]

            if (plainTextSecret === undefined) {
                log(`Finner ikke secret ${secretName} i .env fila`)
                process.exit()
            }

            await updateSecret(repo, secretName, plainTextSecret)
        }
    }

    async function hentPublicKey(repo: RepoConfig) {
        return octokit.request('GET /repos/{owner}/{repo}/actions/secrets/public-key', {
            owner: config.owner,
            repo: repo.name,
        })
    }

    async function updateSecret(repo: RepoConfig, secretName: string, plainTextSecret: string) {
        const secret = plainTextSecret // secret you want to encrypt
        const publicKeyResponse = await hentPublicKey(repo) // base64-encoded-public-key
        const keyId = publicKeyResponse.data.key_id
        const key = publicKeyResponse.data.key

        //Check if libsodium is ready and then proceed.
        await sodium.ready
            .then(() => {
                // Convert Secret & Base64 key to Uint8Array.
                const binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL)
                const binsec = sodium.from_string(secret)

                //Encrypt the secret using LibSodium
                const encBytes = sodium.crypto_box_seal(binsec, binkey)

                // Convert encrypted Uint8Array to Base64
                return sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)
            })
            .then((encryptedSecret: any) => {
                return octokit.request('PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}', {
                    owner: config.owner,
                    repo: repo.name,
                    secret_name: secretName,
                    encrypted_value: encryptedSecret,
                    key_id: keyId,
                })
            })
            .then((res: any) => {
                if (res.status === 201) {
                    log(`✅ Opprettet ny secret ${secretName} i repo ${repo.name}`)
                } else if (res.status === 204) {
                    log(`🔄 Oppdaterte secret ${secretName} i repo ${repo.name}`)
                } else {
                    log('Uventet response fra github', res)
                }
            })
            .catch((e: any) => {
                log(`Klarte ikke oppdatere secret ${secretName} i repo ${repo.name}`, e)
            })
    }
}

/*
async function harSecret(repo: RepoConfig, secretName: string) {
    try {
        const res = await octokit.request('GET /repos/{owner}/{repo}/actions/secrets/{secret_name}', {
            owner: config.owner,
            repo: repo.name,
            secret_name: secretName,
        })
        return res.status === 200
    } catch (e) {
        log(`Secret ${secretName} mangler i repo ${repo}`)
        return false
    }
}
*/
