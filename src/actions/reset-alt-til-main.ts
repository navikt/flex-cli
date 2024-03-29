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

async function canFastForward(path : string): Promise<boolean> {
    try {
        const gitStatusOutput = execSync('git status' , { cwd: path }).toString()
        // console.log(gitStatusOutput)
        // Check if the output contains the phrase indicating fast-forward is possible
        return gitStatusOutput.includes('Your branch is behind') && gitStatusOutput.includes('can be fast-forwarded')
    } catch (error) {
        console.error('Error checking fast-forward status:', error)
        return false
    }
}

async function mainHasDiverged(path : string): Promise<boolean> {
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

async function mainIsAhead(path : string): Promise<boolean> {
    try {
        const gitStatusOutput = execSync('git status', { cwd: path }).toString()
        // console.log(gitStatusOutput)
        // Check for the phrase indicating divergence
        return gitStatusOutput.includes('Your branch is ahead of \'origin/main\'')
    } catch (error) {
        console.error('Error checking ahead status:', error)
        return false
    }
}

async function mainUpToDate(path : string): Promise<boolean> {
try {
        const gitStatusOutput = execSync('git status', { cwd: path }).toString()
        console.log(gitStatusOutput)
        // Check for the phrase indicating divergence
        return gitStatusOutput.includes('Your branch is up to date with \'origin/main\'.')
    } catch (error) {
    console.error('Error checking up to date status:', error)
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
    execSync(`git commit -m "Backup commit"`, { cwd: path })
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


async function checkoutBranchByName(path :string, branchName: string) {
    execSync(`git checkout ${branchName}`, {
        cwd: path,
    })
}

export async function resetAltTilMain() {
    const path = '/Users/kuls/code/flex-cloud-sql-tools' // Replace '.' with your repo path
    execSync('git fetch origin', { cwd: path })

    console.log("checking out" + path)

    // 2. Branch handling
    const currentBranchName = await getCurrentBranchName(path)
    const hasChanges = await repoHasChanges(path)
    // const canFF = await canFastForward(path)
    // const hasDiverged = await mainHasDiverged(path)
    // const isAhead = await mainIsAhead(path)
    // const isHEAD = currentBranchName === ''
        console.log([currentBranchName, hasChanges])




    // first deal with changes in a non main branch

    // then deal with a potential diverged or fast forwardable main branch again

    // this should also deal with detached head
    if (currentBranchName !== 'main' && hasChanges) {
        await createBackupBranch(path, currentBranchName) // empty string if detached head but that should be fine
        await createBackupCommit(path)
    }

    // if there are no changes, change to main is fine
    checkoutBranchByName(path, 'main')


    const canFF = await canFastForward(path)
    const hasDiverged = await mainHasDiverged(path)
    const isAhead = await mainIsAhead(path)
    const isUpToDate = await mainUpToDate(path)


    console.log([currentBranchName, canFF, hasDiverged, hasChanges])

    if (currentBranchName === 'main' && isUpToDate) {
        return
    }

    // when you are on main is in some ways an easier case, if we are not on main we might discover that there are also a diverged main in the repo
    if (currentBranchName === 'main' && canFF) {
        execSync('git pull', { cwd: path })
        return
    }

    if (currentBranchName === 'main' && (hasDiverged || isAhead)) {
        await createBackupBranch(path, currentBranchName)
        await createBackupCommit(path)
        await resetToMain(path)
        return
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
