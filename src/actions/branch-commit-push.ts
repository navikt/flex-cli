import { execSync } from 'node:child_process'

import prompts from 'prompts'

import { config } from '../config/config'
import { log } from '../common/log.ts'

export async function branchCommitPush() {
    const commit = await prompts([
        {
            type: 'text',
            name: 'melding',
            message: 'Hvilken commit melding vil du gi?',
        },
    ])

    if (!commit.melding) {
        process.exit(1)
    }
    const branchNavn = await prompts([
        {
            type: 'text',
            name: 'branch',
            message: 'Hva skal branchnavnet være?',
        },
    ])

    if (!branchNavn.branch) {
        process.exit(1)
    }
    await branchCommitPushAuto(
        branchNavn.branch,
        commit.melding,
        config.repos.map((it) => it.name),
    )
}

export async function branchCommitPushAuto(branchNavn: string, commitmelding: string, repoer: string[]) {
    const repoerMedEndringer: string[] = []
    for (const r of repoer) {
        let endringer = false
        try {
            execSync('git diff-index --quiet HEAD', {
                cwd: `../${r}`,
            })
        } catch (e: any) {
            endringer = true
        }
        if (endringer) {
            log('Fant endringer i ' + r)
            execSync(`git checkout -b ${branchNavn}`, {
                cwd: `../${r}`,
            })
            execSync('git add .', {
                cwd: `../${r}`,
            })
            execSync(`git commit -m "${commitmelding}"`, {
                cwd: `../${r}`,
            })
            execSync(`git push --set-upstream origin ${branchNavn}`, {
                cwd: `../${r}`,
            })
            repoerMedEndringer.push(r)
        } else {
            log('Fant ingen endringer i ' + r)
        }
    }

    if (repoerMedEndringer.length == 0) {
        log('Ingen endringer å lage PR for')
        process.exit(1)
    }

    const lagPr = await prompts([
        {
            type: 'confirm',
            name: 'ok',
            message: `Vil du lage PR for endringene i ${repoerMedEndringer.join(', ')}?`,
        },
    ])

    if (!lagPr.ok) {
        process.exit(1)
    }

    async function sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    async function lagPR(repo: string) {
        try {
            log('Lager PR for ' + repo)
            execSync(`gh pr create --title "${commitmelding}" --body "Fra flex-cli"`, {
                cwd: `../${repo}`,
            })
        } catch (e: any) {
            log('retry om 10 sekunder')
            await sleep(10000)
            await lagPR(repo)
        }
    }

    for (const r of repoerMedEndringer) {
        await lagPR(r)
    }

    const automerge = await prompts([
        {
            type: 'confirm',
            name: 'ok',
            message: `Vil du automerge endringene i ${repoerMedEndringer.join(
                ', ',
            )} til master slik at det går i produksjon?`,
        },
    ])

    if (!automerge.ok) {
        process.exit(1)
    }

    async function automergePr(r: string) {
        try {
            log('Automerger PR for ' + r)
            execSync('gh pr merge --auto -s', {
                cwd: `../${r}`,
            })
        } catch (e: any) {
            log('retry om 10 sekunder')
            await sleep(10000)
            await automergePr(r)
        }
    }

    for (const r of repoerMedEndringer) {
        await automergePr(r)
    }
}
