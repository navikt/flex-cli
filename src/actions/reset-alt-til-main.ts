// import * as fs from 'fs'
import { execSync } from 'node:child_process'
import fs from 'fs'
import path  from 'node:path'

import prompts from 'prompts'

import { config } from '../config/config.ts'
import { log } from '../common/log.ts'

// import prompts from 'prompts'

// import { config } from '../config/config'
// import { log } from '../common/log.ts'

/*
todo you forgot you were on bun and npm installed

What you would like to do:

look at teh github repo:
Are there untracked changes and/or staged changes, add to staged, and make a backup commit to the current branch IF the current branch is not, if it is then create a new backup branch with a timestamp
If there are committed changes to a branch which is not the main branch, there is no problem and you can continue
If the current branch is the main branch, it's a bit more complicated, if you can fast forward and the current main is behind the remote main, you can just fast forward
if the current branch is main But you are ahead of remote main, it's a bit different than you need to create back up commit and reset main to remote

 */

// async function delay(ms : number) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

async function canFastForward(path: string): Promise<boolean> {
    try {
        const gitStatusOutput = execSync('git status', { cwd: path }).toString()
        // console.log(gitStatusOutput)
        // Check if the output contains the phrase indicating fast-forward is possible
        return gitStatusOutput.includes('Your branch is behind') && gitStatusOutput.includes('can be fast-forwarded')
    } catch (error) {
        console.error('Error checking fast-forward status:', error)
        return false
    }
}

async function mainHasDiverged(path: string): Promise<boolean> {
    try {
        const gitStatusOutput = execSync('git status', { cwd: path }).toString()
        // console.log(gitStatusOutput)
        // Check for the phrase indicating divergence
        return gitStatusOutput.includes('have diverged') && gitStatusOutput.includes('different commits each')
    } catch (error) {
        console.error('Error checking divergence status:', error)
        return false
    }
}

async function mainIsAhead(path: string): Promise<boolean> {
    try {
        const gitStatusOutput = execSync('git status', { cwd: path }).toString()
        // console.log(gitStatusOutput)
        // Check for the phrase indicating divergence
        return gitStatusOutput.includes("Your branch is ahead of 'origin/main'")
    } catch (error) {
        console.error('Error checking ahead status:', error)
        return false
    }
}

async function mainUpToDate(path: string): Promise<boolean> {
    try {
        const gitStatusOutput = execSync('git status', { cwd: path }).toString()
        console.log(gitStatusOutput)
        // Check for the phrase indicating divergence
        const upToDateStatus = gitStatusOutput.includes("Your branch is up to date with 'origin/main'")
        console.log(upToDateStatus)
        return upToDateStatus
    } catch (error) {
        console.error('Error checking up to date status:', error)
        return false
    }
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
       returns output like this, if there is more than one branch at a commit reset of the current branch cannot cause data loss
       $ git branch --contains
        jdflsj
       * main

     */
    const commandOutput = execSync('git branch --contains', { cwd: path }).toString().trim()
    const nrOfLines = commandOutput.split('\n').length
    console.log(nrOfLines)
    console.log(commandOutput)
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
    execSync('git reset --hard origin/main', {
        cwd: path,
    })
}

async function checkoutBranchByName(path: string, branchName: string) {
    execSync(`git checkout ${branchName}`, {
        cwd: path,
    })
}

export async function resetRepoToMain(repoPath: string) {
    console.log(`Resetting ${repoPath} to main`)
    execSync('git fetch', { cwd: repoPath })

    if (await repoHasUncommitedChanges(repoPath)) {
        await createBackupBranch(repoPath, await getCurrentBranchName(repoPath)) // empty string if detached head but that should be fine
        await createBackupCommit(repoPath)
    }

    // if there are no unsaved changes, change to main is fine
    await checkoutBranchByName(repoPath, 'main')

    // main is up to date with remote, no need to do anything
    if ((await getCurrentBranchName(repoPath)) === 'main' && (await mainUpToDate(repoPath))) {
        return
    }

    // main is behind remote, fast forward
    if ((await getCurrentBranchName(repoPath)) === 'main' && (await canFastForward(repoPath))) {
        await execSync('git pull --ff-only', { cwd: repoPath })
        return
    }

    // main has diverged or is ahead of remote
    if ((await getCurrentBranchName(repoPath)) === 'main' && ((await mainHasDiverged(repoPath)) || (await mainIsAhead(repoPath)))) {
        if (await backupBranchRequired(repoPath)) {
            await createBackupBranch(repoPath, await getCurrentBranchName(repoPath))
        }

        if (await repoHasUncommitedChanges(repoPath)) {
            await createBackupCommit(repoPath)
        }
        checkoutBranchByName(repoPath, 'main') // checking out main again before reset, after backup
        await resetToMain(repoPath)
    }
}

export async function resetAltTilMain() {
    console.log('Resetter alt til main')
    // const response = await prompts([
    //     {
    //         type: 'confirm',
    //         name: 'ok',
    //         message:
    //             "Denne kommandoen lager backup commits av alle lokale endringer i flex repoer og resetter deretter til main. Om du har comittet endringer i main lokalt må du håndtere dette manuelt. Er du sikker på at du vil kjøre kommandoen?',\n",
    //     },
    // ])
    //
    // if (!response.ok) {
    //     process.exit(1)
    // }

    const listOfRepos = ['flex-bigquery-terraform'].map((x) => ({ name: x }))

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
        resetRepoToMain(repoPath)
    }
}
