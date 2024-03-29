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

import * as NodeGit from 'nodegit'
// import { exit } from 'yargs'
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

async function createBackupCommit(repo: NodeGit.Repository) {

    const currentBranch = await repo.getCurrentBranch()
    const currentBranchName = currentBranch.shorthand()

    if (currentBranchName === 'main') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupBranchName = `backup-${timestamp}`
        await repo.createBranch(backupBranchName, currentBranchName, false) // Force creation if needed
        await repo.checkoutBranch(backupBranchName)
    }

    const index = await repo.refreshIndex()
    await index.addAll()
    await index.write()

    const defaultSignature = repo.defaultSignature()

    // 2. Extract author and committer details
    const author = defaultSignature
    const committer = defaultSignature

    const oid = await index.writeTree()


    await repo.createCommit('HEAD', author, committer, 'Backup Commit', oid, [])
}

async function repoHasChanges(repo: NodeGit.Repository): Promise<boolean> {
    const status = await repo.getStatus()
    return status.length > 0
}
export async function resetAltTilMain() {
    const repo = await NodeGit.Repository.open('/Users/kuls/code/flex-cloud-sql-tools') // Replace '.' with your repo path

    // 2. Branch handling
    const currentBranch = await repo.getCurrentBranch()
    const currentBranchName = currentBranch.shorthand()

    const hasChanges = await repoHasChanges(repo)
    // deal with not main branch first
    if (currentBranchName !== 'main') {
        if (hasChanges) {
            await createBackupCommit(repo)
        }

        // checkout main, try catch around this, should always be able to checkout main
        // try {
        await repo.checkoutBranch('main')
        // } catch (error) {
        //   console.error('Error checking out main:', error);
        //   exit(1);
        // }

        if (currentBranchName === 'main') {
            // await handleMainBranch(repo);
            // can I fast forward? Am I just behind main?

            const canFF = await canFastForward()
            const hasDiverged = await mainHasDiverged()

            if (canFF) {
                console.log('Local main branch can fast-forward to origin/main')
            }

            if (hasDiverged) {
                console.log('Local main branch has diverged from origin/main')
            }
        }
        // ... rest of your logic
    }
}

resetAltTilMain()
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
