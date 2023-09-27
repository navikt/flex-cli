import { octokit } from './octokit'
import { config } from './config'

interface Opts {
    pull_number: number
    repo: string
}

export async function labelPrForAutoMerge(opts: Opts) {
    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/labels', {
        owner: config.owner,
        repo: opts.repo,
        issue_number: opts.pull_number,
        labels: ['automerge'],
    })
}
