import { octokit } from './octokit'
import { owner } from './owner'

interface Opts {
    pull_number: number
    repo: string
}

export async function approvePullrequest(opts: Opts) {
    await octokit.request(
        'POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews',
        {
            owner,
            repo: opts.repo,
            pull_number: opts.pull_number,
            body: 'Godkjent med flex-github-tools',
            event: 'APPROVE',
        }
    )
}
