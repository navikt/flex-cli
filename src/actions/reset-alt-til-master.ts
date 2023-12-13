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
                'Denne kommandoen lager backup commits av alle lokale endringer i flex repoer og resetter deretter til master. Om du har comittet endringer i master lokalt må du håndtere dette manuelt. Er du sikker på at du vil kjøre kommandoen?\',\n',
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

        const status = execSync('git status --porcelain', { cwd: path }).toString();
        if (status) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupBranch = `backup-${timestamp}`;
            execSync(`git checkout -b ${backupBranch}`, { cwd: path });
            execSync('git add -A', { cwd: path });
            execSync(`git commit -m "Backup commit on ${backupBranch}"`, { cwd: path });
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
            execSync('git config pull.ff only', {
                cwd: path,
            })
        }
    }

    log('\n\nAlt resatt til master')
}
