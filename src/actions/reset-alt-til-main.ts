// import * as fs from 'fs'
import { execSync } from 'node:child_process'
import fs from 'fs'
import path from 'node:path'

import prompts from 'prompts'

import { config } from '../config/config.ts'
import { log } from '../common/log.ts'
// import { simpleGit } from 'simple-git';
enum GitBranchStatus {
    UP_TO_DATE = "Your branch is up to date with 'origin/main'",
    BEHIND_CAN_FAST_FORWARD = "Your branch is behind 'origin/main' and can be fast-forwarded",
    DIVERGED = "Your branch and 'origin/main' have diverged",
    AHEAD = "Your branch is ahead of 'origin/main'",
    BEHIND_CANNOT_FAST_FORWARD = "Your branch is behind 'origin/main'",
}
async function checkGitBranchStatus(path: string): Promise<GitBranchStatus> {
    const gitStatusOutput = execSync('git status', { cwd: path }).toString()
    console.log(gitStatusOutput)
    if ((await getCurrentBranchName(path)) !== 'main') {
        throw new Error('Error: This function should only be called on main branch')
    }

    if (gitStatusOutput.includes(GitBranchStatus.UP_TO_DATE)) {
        return GitBranchStatus.UP_TO_DATE
    } else if (
        gitStatusOutput.includes("Your branch is behind 'origin/main'") &&
        gitStatusOutput.includes('and can be fast-forwarded')
    ) {
        return GitBranchStatus.BEHIND_CAN_FAST_FORWARD
    } else if (
        gitStatusOutput.includes("Your branch is behind 'origin/main'") &&
        !gitStatusOutput.includes('and can be fast-forwarded')
    ) {
        return GitBranchStatus.BEHIND_CANNOT_FAST_FORWARD
    } else if (gitStatusOutput.includes(GitBranchStatus.DIVERGED)) {
        return GitBranchStatus.DIVERGED
    } else if (gitStatusOutput.includes(GitBranchStatus.AHEAD)) {
        return GitBranchStatus.AHEAD
    } else {
        console.error('======')
        console.error(gitStatusOutput)
        console.error('======')
        throw new Error('All possible cases should be covered.')
    }
}
async function canFastForward(path: string): Promise<boolean> {
    return (await checkGitBranchStatus(path)) === GitBranchStatus.BEHIND_CAN_FAST_FORWARD
}
async function mainIsAhead(path: string): Promise<boolean> {
    return (await checkGitBranchStatus(path)) === GitBranchStatus.AHEAD
}

async function mainUpToDate(path: string): Promise<boolean> {
    return (await checkGitBranchStatus(path)) === GitBranchStatus.UP_TO_DATE
}

async function mainHasDiverged(path: string): Promise<boolean> {
    return (await checkGitBranchStatus(path)) === GitBranchStatus.DIVERGED
}

async function getCurrentBranchName(path: string): Promise<string> {
    /* if it is nothing, you are probably at main */
    try {
        return execSync('git branch --show-current', { cwd: path }).toString().trim()
    } catch (error) {
        console.error('Error getting current branch:', error)
        return ''
    }
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
    console.log(`Resetting ${repoPath} to main`)
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

    console.log('Resetter alt til main')

    for (const repo of config.repos) {
        // for (const repo of listOfRepos) {
        const relativePath = `../${repo.name}`
        const repoPath = path.resolve(relativePath)
        console.log(`Checking ${repoPath}`)
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

        console.log('ready to reset')
        await resetRepoToMain(repoPath)
    }
}
