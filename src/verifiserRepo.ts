import { octokit } from './octokit'
import { config } from './config'
import { RepoConfig } from './types'

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function hentEllerLagRepo(r: RepoConfig) {
    try {
        const repo = await octokit.request('GET /repos/{owner}/{repo}', {
            owner: config.owner,
            repo: r.name,
        })

        return repo
    } catch (e: any) {
        if (e.status === 404) {
            await octokit.request('POST /orgs/{org}/repos', {
                org: config.owner,
                name: r.name,
                private: false,
                auto_init: true,
                default_branch: 'master',
                visibility: 'public',
            })
            await sleep(2000)
            await octokit.request(
                'POST /repos/{owner}/{repo}/branches/{branch}/rename',
                {
                    owner: config.owner,
                    repo: r.name,
                    branch: 'main',
                    new_name: 'master',
                }
            )
            await sleep(2000)
            const repo = await octokit.request('GET /repos/{owner}/{repo}', {
                owner: config.owner,
                repo: r.name,
            })
            return repo
        } else {
            throw e
        }
    }
}

export async function verifiserRepo(r: RepoConfig) {
    const repo = await hentEllerLagRepo(r)

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

    await verifiserAdminTeams(r.name)

    if (!ok) {
        return false
    }
    if (!defaultSjekkOk) {
        return false
    }
    return true
}

async function verifiserAdminTeams(repo: string) {
    const repoTeams = await octokit.request('GET /repos/{owner}/{repo}/teams', {
        owner: config.owner,
        repo: repo,
    })

    const adminTeams = repoTeams.data
        .filter((team) => team.permission === 'admin')
        .map((team) => team.name)

    const aksepterteTeams = ['flex']
    for (const team of adminTeams) {
        if (!aksepterteTeams.includes(team)) {
            console.error(`Team ${team} har admin tilgang til ${repo}`)
            process.exit(1)
        }
    }

    for (const team of aksepterteTeams) {
        if (!adminTeams.includes(team)) {
            console.log(
                'Gir admin tilgang til team: ' +
                    team +
                    ' for repo: ' +
                    repo +
                    ''
            )
            await octokit.request(
                'PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}',
                {
                    org: config.owner,
                    team_slug: team,
                    owner: config.owner,
                    repo: repo,
                    permission: 'admin',
                }
            )
        }
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
        if (protection.data.enforce_admins?.enabled != true) {
            console.log(`${repo.name} har enforce admins ikke true`)
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
    if (!labels.data.map((l) => l.name).includes('designsystemet')) {
        console.log(`Lager designsystemet label i repoet ${repo.name}`)

        await octokit.request('POST /repos/{owner}/{repo}/labels', {
            owner: config.owner,
            repo: repo.name,
            name: 'designsystemet',
            description: 'Oppgradering av designsystemet',
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
                    enforce_admins: true,
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
