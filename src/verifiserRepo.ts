import { Octokit } from '@octokit/rest'
import { owner } from './owner'

const octokit = new Octokit({
    auth: process.env.GITHUB_PAT,
})

export async function verifiserRepo(repoName: string) {
    const repo = await octokit.request('GET /repos/{owner}/{repo}', {
        owner,
        repo: repoName,
    })
    if (repo.data.allow_auto_merge != true) {
        throw Error(repo.data.full_name + ' mangler allow automerge')
    }
    await verifiserDefaultBranchProtection(repoName, repo.data.default_branch)
}

async function verifiserDefaultBranchProtection(repo: string, branch: string) {
    const protection = octokit.request(
        'GET /repos/{owner}/{repo}/branches/{branch}/protection',
        {
            owner,
            repo,
            branch,
        }
    )
    console.log(JSON.stringify(protection))
}
