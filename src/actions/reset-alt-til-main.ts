// import * as fs from 'fs'
import { execSync } from 'node:child_process'

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

// import * as NodeGit from 'nodegit'
// import { exit } from 'yargs'p
// import nodegit types from @types/nodegit

// async function canFastForward(repo: NodeGit.Repository, branch: string, targetBranch: string): Promise<boolean> {
//   // Find the merge base
//   const mergeBase = await repo.mergeBase(branch, targetBranch);
//
//   // Get the Oid of the specified branch's HEAD
//   const headCommit = await repo.getReferenceCommit(branch);
//   const headOid = headCommit.id();
//
//   return mergeBase.isEqual(headOid);
// }
//
//

async function canFastForward(): Promise<boolean> {
    try {
        const gitStatusOutput = execSync('git status').toString()

        // Check if the output contains the phrase indicating fast-forward is possible
        return gitStatusOutput.includes('Your branch is behind') && gitStatusOutput.includes('can be fast-forwarded')
    } catch (error) {
        console.error('Error checking fast-forward status:', error)
        return false
    }
}

async function mainHasDiverged(): Promise<boolean> {
    try {
        const gitStatusOutput = execSync('git status').toString()

        // Check for the phrase indicating divergence
        return gitStatusOutput.includes('have diverged') && gitStatusOutput.includes('different commits each')
    } catch (error) {
        console.error('Error checking divergence status:', error)
        return false
    }
}

async function getCurrentBranchName(path : string): Promise<string> {
    /* if it is nothing, you are probably at main */
    try {
        return execSync('git branch --show-current', { cwd: path }).toString().trim()
    } catch (error) {
        console.error('Error getting current branch:', error)
        return ''
    }
}

async function createBackupCommit(path : string) {
    execSync('git add -A', { cwd: path })
    execSync(`git commit -m "Backup commit on ${getCurrentBranchName(path)}"`, { cwd: path })
}

async function createBackupBranch(path : string, branchName : string) {
     const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupBranchName = `backup-${timestamp}-${branchName}`
                execSync(`git checkout -b ${backupBranchName}`, { cwd: path })



}

async function repoHasChanges(path : string): Promise<boolean> {
    return execSync('git status --porcelain', { cwd: path }).toString() !== ''

}

async function resetToMain(path : string) {
    execSync('git reset --hard', {
        cwd: path,
    })
}


export async function resetAltTilMain() {
    const path = '/Users/kuls/code/flex-cloud-sql-tools' // Replace '.' with your repo path
    execSync('git fetch origin', { cwd: path })

    // 2. Branch handling
    const currentBranchName = await getCurrentBranchName(path)
    const canFF = await canFastForward()
    const hasDiverged = await mainHasDiverged()

    const hasChanges = await repoHasChanges(path)

    if (currentBranchName === 'main' && canFF) {
        execSync('git pull', { cwd: path })
        return
    }


    if (currentBranchName === 'main' && hasDiverged) {
        await createBackupBranch(path, currentBranchName)
        await createBackupCommit(path)
        await resetToMain(path)
    }

    if (currentBranchName !== 'main' && hasChanges) {


    }



    if (currentBranchName !== 'main') {
        // do nothing
    }

    if (currentBranchName !== 'main' && hasChanges) {
        await createBackupBranch(path, currentBranchName)
        await createBackupCommit(path)
    }

}
//
// async function handleMainBranch(repo: NodeGit.Repository) {
//   const remoteMain = await NodeGit.Reference.nameToId(repo, 'refs/remotes/origin/main');
//   const currentHead = await NodeGit.Reference.nameToId(repo, 'HEAD');
//
//   const canFastForward = await NodeGit.Merge.fastForward(repo, currentHead, remoteMain);
//
//   if (canFastForward) {
//     // ... perform fast-forward
//   } else {
//     await createBackupCommit(repo);
//     await repo.setHead('refs/remotes/origin/main'); // Reset to remote
//   }
// }
//
//
//     log('\n\nAlt resatt til main')
