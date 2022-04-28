import { octokit } from './octokit'
import { config } from './config'
import { RepoConfig } from './types'

export async function verifiserRepo(r: RepoConfig) {
    const repo = await octokit.request('GET /repos/{owner}/{repo}', {
        owner: config.owner,
        repo: r.name,
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

    await verifiserDefaultBranchProtection(r, repo.data.default_branch)
}

async function verifiserDefaultBranchProtection(
    repo: RepoConfig,
    branch: string
) {
    const protection = await octokit.request(
        'GET /repos/{owner}/{repo}/branches/{branch}/protection',
        {
            owner: config.owner,
            repo: repo.name,
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
    const context = protection.data.required_status_checks.contexts
    for (const check of repo.checks) {
        if (!context.includes(check)) {
            throw Error(`${repo.name} har ikke ${check} påkrevd`)
        }
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
