import { execSync } from 'node:child_process'
import fs from 'fs'
import path from 'node:path'

import prompts from 'prompts'

import { config } from '../config/config.ts'
import { log } from '../common/log.ts'

async function getGitBranchStatus(path: string): Promise<string> {
    return execSync('git status', { cwd: path }).toString()
}
async function canFastForward(path: string): Promise<boolean> {
    const status = await getGitBranchStatus(path)
    return status.includes("Your branch is behind 'origin/main'") && status.includes('and can be fast-forwarded')
}
async function mainIsAhead(path: string): Promise<boolean> {
    return (await getGitBranchStatus(path)).includes("Your branch is ahead of 'origin/main'")
}

async function mainUpToDate(path: string): Promise<boolean> {
    return (await getGitBranchStatus(path)).includes("Your branch is up to date with 'origin/main'")
}

async function mainHasDiverged(path: string): Promise<boolean> {
    return (await getGitBranchStatus(path)).includes("Your branch and 'origin/main' have diverged")
}

async function getCurrentBranchName(path: string): Promise<string> {
    return execSync('git branch --show-current', { cwd: path }).toString().trim()
}
async function createBackupCommit(path: string) {
    execSync('git add -A', { cwd: path })
    execSync(`git commit -m "Backup commit"`, { cwd: path })
}
async function backupBranchRequired(path: string): Promise<boolean> {
    /*
      The "git branch --contains" command below outputs a newline separated list of branches with an extra line at the
      end. This means we can use the output to see how many branches exist at the current commit point.
     */
    const commandOutput = execSync('git branch --contains', { cwd: path }).toString().trim()
    const nrOfLines = commandOutput.split('\n').length
    return 1 >= nrOfLines // if there is only one branch at the commit, we need to create a backup branch before resetting main
}
async function createBackupBranch(path: string, branchName: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupBranchName = `backup-${timestamp}-${branchName}`
    execSync(`git checkout -b ${backupBranchName}`, { cwd: path })
}
async function repoHasUncommitedChanges(path: string): Promise<boolean> {
    return execSync('git status --porcelain', { cwd: path }).toString() !== ''
}
async function resetToMain(path: string) {
    if (await repoHasUncommitedChanges(path)) {
        new Error('Did not clean up suffiently before reset to main')
    }
    execSync('git reset --hard origin/main', {
        cwd: path,
    })
}
async function checkoutBranchByName(path: string, branchName: string) {
    execSync(`git checkout ${branchName}`, {
        cwd: path,
    })
}
async function repoFinishedAsExpected(repoPath: string): Promise<boolean> {
    return (await getCurrentBranchName(repoPath)) === 'main' && (await mainUpToDate(repoPath))
}
export async function resetRepoToMain(repoPath: string) {
    log(`Resetting ${repoPath} to main`)
    execSync('git fetch', { cwd: repoPath })

    if (await repoHasUncommitedChanges(repoPath)) {
        await createBackupBranch(repoPath, await getCurrentBranchName(repoPath)) // empty string if detached head but that should be fine
        await createBackupCommit(repoPath)
    }

    // if there are no unsaved changes, checking out the main branch is fine
    await checkoutBranchByName(repoPath, 'main')

    // main is up to date with remote, there is no need to do anything
    if ((await getCurrentBranchName(repoPath)) === 'main' && (await mainUpToDate(repoPath))) {
        return
    }

    // main is behind remote, fast forward
    if ((await getCurrentBranchName(repoPath)) === 'main' && (await canFastForward(repoPath))) {
        await execSync('git pull --ff-only', { cwd: repoPath })
        if (await repoFinishedAsExpected(repoPath)) {
            return
        } else {
            new Error('Error: Repo did not finish as expected')
        }
    }

    // main has diverged or is ahead of remote
    if (
        (await getCurrentBranchName(repoPath)) === 'main' &&
        ((await mainHasDiverged(repoPath)) || (await mainIsAhead(repoPath)))
    ) {
        if (await backupBranchRequired(repoPath)) {
            await createBackupBranch(repoPath, await getCurrentBranchName(repoPath))
        }

        if (await repoHasUncommitedChanges(repoPath)) {
            await createBackupCommit(repoPath)
        }
        checkoutBranchByName(repoPath, 'main') // checking out main again before reset, after backup
        await resetToMain(repoPath)
        if (await repoFinishedAsExpected(repoPath)) {
            return
        } else {
            new Error('Error: Repo cleanup was not finished as expected')
        }
    }
    new Error('Error: Did not expect to get here, a case was not covered')
}

export async function resetAltTilMainNew() {
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

    // eslint-disable-next-line no-console
    console.log('Resetter alt til main')

    for (const repo of config.repos) {
        const relativePath = `../${repo.name}`
        const repoPath = path.resolve(relativePath)
        if (repo.name === 'flex-cli') {
            log(`Repo ${repo.name} er flex-cli. Ignorerer`)
            continue
        }

        try {
            await fs.promises.access(repoPath)
        } catch (error) {
            log(`Error: Repo ${repo.name} finnes ikke. Kjør 'npm run klon-alle'`)
            continue
        }

        await resetRepoToMain(repoPath)
    }
}
