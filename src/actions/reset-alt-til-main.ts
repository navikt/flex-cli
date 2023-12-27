import * as fs from 'fs'
import { execSync } from 'node:child_process'

import prompts from 'prompts'

import { config } from '../config/config'
import { log } from '../common/log.ts'

export async function resetAltTilMain() {
    const response = await prompts([
        {
            type: 'confirm',
            name: 'ok',
            message:
                "Denne kommandoen lager backup commits av alle lokale endringer i flex repoer og resetter deretter til main. Om du har comittet endringer i main lokalt må du håndtere dette manuelt. Er du sikker på at du vil kjøre kommandoen?',\n",
        },
    ])

    if (!response.ok) {
        process.exit(1)
    }

    for (const repo of config.repos) {
        const path = `../${repo.name}`

        if (repo.name === 'flex-cli') {
            log(`Repo ${repo.name} er flex-cli. Ignorerer`)
            continue
        }

        try {
            await fs.promises.access(path)
        } catch (error) {
            log(`Error: Repo ${repo.name} finnes ikke. Kjør 'npm run klon-alle'`)
            continue
        }

        const status = execSync('git status --porcelain', { cwd: path }).toString()
        if (status) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const backupBranch = `backup-${timestamp}`
            execSync(`git checkout -b ${backupBranch}`, { cwd: path })
            execSync('git add -A', { cwd: path })
            execSync(`git commit -m "Backup commit on ${backupBranch}"`, { cwd: path })
        }

        log(`Resetter ${repo.name} til main`)
        execSync('git clean -f', {
            cwd: path,
        })
        execSync(' git reset .', {
            cwd: path,
        })
        execSync('git restore .', {
            cwd: path,
        })
        execSync('git checkout main', {
            cwd: path,
        })
        execSync('git pull --ff-only', {
            cwd: path,
        })
    }

    log('\n\nAlt resatt til main')
}
