import * as fs from 'fs'
import { execSync } from 'node:child_process'

import prompts from 'prompts'

import { config } from '../config/config'
import { log } from '../common/log.ts'

export async function resetAltTilMaster() {
    const response = await prompts([
        {
            type: 'confirm',
            name: 'ok',
            message:
                'Denne kommandoen fjerner alle lokale endringer i flex repoer og resetter til master. Er du sikker?',
        },
    ])

    if (!response.ok) {
        process.exit(1)
    }

    for (const repo of config.repos) {
        const path = `../${repo.name}`

        try {
            await fs.promises.access(path)
        } catch (error) {
            log(`Error: Repo ${repo.name} finnes ikke. Kjør 'npm run klon-alle'`)
            continue
        }

        if (repo.name != 'flex-cli') {
            log(`Resetter ${repo.name} til master`)
            execSync('git clean -f', {
                cwd: path,
            })
            execSync(' git reset .', {
                cwd: path,
            })
            execSync('git restore .', {
                cwd: path,
            })
            execSync('git checkout master', {
                cwd: path,
            })
            execSync('git pull', {
                cwd: path,
            })
        }
    }

    log('\n\nAlt resatt til master')
}
