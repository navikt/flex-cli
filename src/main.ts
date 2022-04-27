import * as prompts from 'prompts'

import { owner } from './owner'
import { verifiserRepo } from './verifiserRepo'
import { octokit } from './octokit'
import { approvePullrequest } from './approvePullrequest'
import { enablePullRequestAutoMerge } from './enableAutoMerge'

console.log('\n\n\n')

const repo = 'flex-testdata-reset'

await verifiserRepo(repo)

const pulls = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
    owner,
    repo,
})

interface ApprovedPr {
    pull_number: number
    repo: string
    node_id: string
    auto_merge: object | null
}

const choices = pulls.data
    .filter((it) => it.state == 'open')
    .filter((it) => it.user?.login == 'dependabot[bot]')
    .map((it) => {
        const value: ApprovedPr = {
            pull_number: it.number,
            auto_merge: it.auto_merge,
            node_id: it.node_id,
            repo,
        }
        return {
            title: it.title,
            value,
        }
    })

if (choices.length == 0) {
    console.log('Ingen PR å behandle')
    process.exit()
}

const response = await prompts([
    {
        type: 'multiselect',
        name: 'approve',
        message: 'Hvilke pullrequests skal godkjennes?',
        choices,
    },
])

if (response.approve.length == 0) {
    console.log('Ingen PR valgt')
    process.exit()
}

response.approve.forEach(async (pr: ApprovedPr) => {
    if (pr.auto_merge == null) {
        await enablePullRequestAutoMerge(pr.node_id)
    }
    await approvePullrequest(pr)
})
