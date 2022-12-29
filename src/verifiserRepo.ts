import { octokit } from './octokit'
import { config } from './config'
import { RepoConfig } from './types'

export async function verifiserRepo(r: RepoConfig, antallOrgAdmins: number) {
    const repo = await octokit.request('GET /repos/{owner}/{repo}', {
        owner: config.owner,
        repo: r.name,
    })

    let ok = true

    function verifiser(key: string, forventet: any) {
        if ((repo.data as any)[key] !== forventet) {
            ok = false
            console.log(`${repo.data.full_name} ${key} != ${forventet}`)
        }
    }

    verifiser('default_branch', 'master')
    verifiser('allow_auto_merge', true)
    verifiser('delete_branch_on_merge', true)
    verifiser('allow_rebase_merge', false)
    verifiser('allow_merge_commit', false)
    verifiser('allow_squash_merge', true)
    verifiser('archived', false)
    verifiser('has_issues', false)
    verifiser('has_projects', false)
    verifiser('has_wiki', false)

    if (!(repo.data.topics as string[]).includes('team-flex')) {
        console.log(
            `${repo.data.full_name} mangler team-flex topic i ${repo.data.topics}`
        )
        await octokit.request('PUT /repos/{owner}/{repo}/topics', {
            owner: config.owner,
            repo: r.name,
            names: ['team-flex'],
        } as any)
    }
    if (!ok) {
        if (r.patch) {
            console.log(`Oppdaterer repo innstillinger for ${r.name}`)

            await octokit.request('PATCH /repos/{owner}/{repo}', {
                owner: config.owner,
                repo: r.name,
                allow_auto_merge: true,
                default_branch: 'master',
                delete_branch_on_merge: true,
                allow_rebase_merge: false,
                allow_merge_commit: false,
                allow_squash_merge: true,
                has_issues: false,
                has_projects: false,
                has_wiki: false,
            })
        } else {
            console.error(`Repo ${r.name} har feil oppsett`)
        }
    }
    const defaultSjekkOk = await verifiserDefaultBranchProtection(
        r,
        repo.data.default_branch
    )
    await verifiserCollaborators(r.name, 'admin', antallOrgAdmins)
    await verifiserCollaborators(r.name, 'maintain', antallOrgAdmins)
    await verifiserCollaborators(r.name, 'push', antallOrgAdmins)

    if (!ok) {
        return false
    }
    if (!defaultSjekkOk) {
        return false
    }
    return true
}

async function verifiserCollaborators(
    repo: string,
    permission: string,
    antallOrgAdmins: number
) {
    const collab = await octokit.request(
        'GET /repos/{owner}/{repo}/collaborators{?permission}',
        {
            owner: config.owner,
            repo: repo,
            permission: permission,
        }
    )
    if (collab.data.length != antallOrgAdmins + config.antallFlexMembers) {
        console.error(
            `Repo ${repo} har feil antall ${permission} collaborators. Forventet ${
                antallOrgAdmins + config.antallFlexMembers
            }. Fant ${collab.data.length}`
        )
    }
}

async function verifiserDefaultBranchProtection(
    repo: RepoConfig,
    branch: string
): Promise<boolean> {
    let ok = true

    try {
        const protection = await octokit.request(
            'GET /repos/{owner}/{repo}/branches/{branch}/protection',
            {
                owner: config.owner,
                repo: repo.name,
                branch,
            }
        )

        if (!protection.data.required_status_checks) {
            ok = false
            console.log(`${repo.name} mangler required status checks`)
        }

        if (protection.data.required_status_checks?.strict != false) {
            console.log(
                `${repo.name} har strict status check (branch up to date)`
            )
            ok = false
        }
        if (!protection.data.required_status_checks?.contexts) {
            console.log(
                `${repo.name} har ikke strict status check (branch up to date)`
            )
            ok = false
        }

        const context = protection.data.required_status_checks?.contexts
        if (repo.checks) {
            for (const check of repo.checks) {
                if (!context || !context.includes(check)) {
                    console.log(`${repo.name} har ikke ${check} påkrevd`)
                    ok = false
                }
            }
        }

        if (!protection.data.required_pull_request_reviews) {
            console.log(`${repo.name} har ikke required_pull_request_reviews`)
            ok = false
        }
        if (
            protection.data.required_pull_request_reviews
                ?.required_approving_review_count != 0
        ) {
            console.log(`${repo.name} har required_approving_review_count != 0`)
            ok = false
        }
        if (
            protection.data.required_pull_request_reviews
                ?.require_code_owner_reviews != false
        ) {
            console.log(`${repo.name} har require_code_owner_reviews != false`)
            ok = false
        }
    } catch (e) {
        console.error('Feil med branch protection', e)
        ok = false
    }

    const labels = await octokit.request('GET /repos/{owner}/{repo}/labels', {
        owner: config.owner,
        repo: repo.name,
    })
    if (!labels.data.map((l) => l.name).includes('automerge')) {
        console.log(`Lager automerge label i repoet ${repo.name}`)

        await octokit.request('POST /repos/{owner}/{repo}/labels', {
            owner: config.owner,
            repo: repo.name,
            name: 'automerge',
            description: 'Kandidat for automerging hvis alt går grønt',
            color: 'f29513',
        })
    }
    if (!ok) {
        if (repo.patch) {
            console.log(
                `Oppdaterer branch protection innstillinger for ${repo.name}`
            )
            await octokit.request(
                'PUT /repos/{owner}/{repo}/branches/{branch}/protection',
                {
                    owner: config.owner,
                    repo: repo.name,
                    branch,
                    required_status_checks: {
                        strict: false,
                        contexts: repo.checks || [],
                    },
                    enforce_admins: false,
                    required_pull_request_reviews: {
                        dismiss_stale_reviews: false,
                        require_code_owner_reviews: false,
                        required_approving_review_count: 0,
                    },
                    restrictions: null,
                    required_linear_history: true,
                    allow_force_pushes: false,
                    allow_deletions: false,
                    required_conversation_resolution: true,
                }
            )
        } else {
            console.error(
                `Repo ${repo.name} har feil branch protection oppsett`
            )
        }
    }
    return ok
}
