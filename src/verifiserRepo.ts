import { owner } from './owner'
import { octokit } from './octokit'

export async function verifiserRepo(repoName: string) {
    const repo = await octokit.request('GET /repos/{owner}/{repo}', {
        owner,
        repo: repoName,
    })

    function verifiser(key: string, forventet: boolean) {
        if ((repo.data as any)[key] !== forventet) {
            throw Error(`${repo.data.full_name} ${key} != ${forventet}`)
        }
    }

    verifiser('allow_auto_merge', true)
    verifiser('delete_branch_on_merge', true)
    verifiser('allow_rebase_merge', false)
    verifiser('allow_merge_commit', false)
    verifiser('allow_squash_merge', true)
    verifiser('archived', false)

    await verifiserDefaultBranchProtection(repoName, repo.data.default_branch)
}

const påkrevdeChecks = ['Bygg, test og push Docker image']

async function verifiserDefaultBranchProtection(repo: string, branch: string) {
    const protection = await octokit.request(
        'GET /repos/{owner}/{repo}/branches/{branch}/protection',
        {
            owner,
            repo,
            branch,
        }
    )
    if (!protection.data.required_status_checks) {
        throw Error(`${repo} mangler required status checks`)
    }

    if (protection.data.required_status_checks.strict != true) {
        throw Error(`${repo} har ikke strict status check (branch up to date)`)
    }
    if (!protection.data.required_status_checks.contexts) {
        throw Error(`${repo} har ikke strict status check (branch up to date)`)
    }
    if (protection.data.required_status_checks.contexts.length !== 1) {
        throw Error(
            `${repo} har mer enn en status check, vi støtter ikke det i denne koden ennå`
        )
    }
    const context = protection.data.required_status_checks.contexts[0]
    if (!påkrevdeChecks.includes(context)) {
        throw Error(`${repo} sjekk ${context} er ikke forventet`)
    }
    if (!protection.data.required_pull_request_reviews) {
        throw Error(`${repo} har ikke required_pull_request_reviews`)
    }
    if (
        protection.data.required_pull_request_reviews
            .required_approving_review_count != 1
    ) {
        throw Error(`${repo} har required_approving_review_count != 1`)
    }
    if (
        protection.data.required_pull_request_reviews
            .require_code_owner_reviews != true
    ) {
        throw Error(`${repo} har require_code_owner_reviews != true`)
    }
}
