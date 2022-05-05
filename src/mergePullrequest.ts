import { octokit } from './octokit'
import { config } from './config'
import { ApprovedPr } from './types'
import { sleep } from './sleep'

export async function mergePullrequest(opts: ApprovedPr) {
    console.log('Merger ' + opts.title)

    await octokit.request(
        'PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge',
        {
            owner: config.owner,
            repo: opts.repo,
            pull_number: opts.pull_number,
            merge_method: 'squash',
        }
    )
    await sleep(2000)
}
