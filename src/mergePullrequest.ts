import { octokit } from './octokit'
import { config } from './config'
import { ApprovedPr } from './types'

export async function mergePullrequest(opts: ApprovedPr) {
    console.log(`Merger ${opts.title} i ${opts.repo}`)

    await octokit.request(
        'PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge',
        {
            owner: config.owner,
            repo: opts.repo,
            pull_number: opts.pull_number,
            merge_method: 'squash',
        }
    )
}
