import { execSync } from 'node:child_process'

import { log } from '../common/log.ts'
import { config } from '../config/config.ts'

export async function slettGone() {
    // eksisterende kode ...

    for (const repo of config.repos) {
        const path = `../${repo.name}`

        // eksisterende kode ...

        // Ny kode for å håndtere sletting av branches
        try {
            slettGoneBranches(path, repo.name)
        } catch (error: any) {
            log(`Error under sletting av branches for repo ${repo.name}: ${error.message}`)
        }
    }

    log('\n\nGamle branches slettet')
}

function slettGoneBranches(repoPath: string, name: string) {
    // Hent og rens opp fjern branches
    execSync('git fetch --prune', { cwd: repoPath })

    // Finn branches som er merket som 'gone'
    const goneBranches = execSync("git branch -vv | grep ': gone]' | awk '{print $1}'", { cwd: repoPath })
        .toString()
        .trim()
        .split('\n')
        .filter((branch) => branch !== '*')

    if (goneBranches.length === 0 || (goneBranches.length === 1 && goneBranches[0] === '')) {
        log('Ingen gamle branches å slette i ' + name)
        return
    }

    // Logg og slett hver branch
    goneBranches.forEach((branch) => {
        if (branch) {
            log(`Sletter branch ${branch} i ${name}`)
            execSync(`git branch -D ${branch}`, { cwd: repoPath })
        }
    })
}
