import { execSync } from 'node:child_process'

import prompts from 'prompts'

import { log } from '../common/log.ts'
import { getAllRepos } from '../common/get-all-repos.ts'

import { resetAltTilMain } from './reset-alt-til-main.ts'

export async function gradleBump() {
    log('Bumper gradle bumping')

    const githubrepos = (await getAllRepos()).map((it) => it.name)

    const pullok = await prompts([
        {
            type: 'confirm',
            name: 'ok',
            message: `Har du husket å pulle alle repoene og satt til master?`,
        },
    ])
    if (!pullok.ok) {
        await resetAltTilMain()
    }

    const repoerMedEndringer: string[] = []
    for (const r of githubrepos) {
        const harGradle = await Bun.file(`../${r}/gradlew`).exists()

        if (harGradle) {
            log(`Oppdaterer gradle i ${r}`)
            execSync(`./gradlew wrapper --gradle-version 8.4`, {
                cwd: `../${r}`,
            })
            repoerMedEndringer.push(r)
        }
    }
    /*
        await branchCommitPushAuto(
            `gradlebump-${Math.floor(Math.random() * 100)}`,
            `Oppgraderer gradle`,
            repoerMedEndringer,
        )
        */
}
