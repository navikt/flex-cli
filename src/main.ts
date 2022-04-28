import * as prompts from 'prompts'

import { verifiserRepo } from './verifiserRepo'
import { octokit } from './octokit'
import { approvePullrequest } from './approvePullrequest'
import { enablePullRequestAutoMerge } from './enableAutoMerge'
import { config } from './config'
import { ApprovedPr, RepoConfig } from './types'

console.log('\n\n')

const repoerTilBehandling = (
    await prompts([
        {
            type: 'multiselect',
            name: 'repoer',
            message: 'Hvilke pullrequests skal godkjennes?',
            choices: config.repos.map((r) => ({ title: r.name, value: r })),
        },
    ])
).repoer as RepoConfig[]
if (!repoerTilBehandling || repoerTilBehandling.length == 0) {
    console.log('ingen repoer valgt')
    process.exit(0)
}

for (const r of repoerTilBehandling) {
    await verifiserRepo(r)
}

const pullsTilBehandling = []

for (const r of repoerTilBehandling) {
    const pulls = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
        owner: config.owner,
        repo: r.name,
    })
    pullsTilBehandling.push(...pulls.data)
}

const choices = pullsTilBehandling
    .filter(() => {
        //console.log(it)
        return true
    })
    .filter((it) => it.state == 'open')
    .filter((it) => it.user?.login == 'dependabot[bot]')
    .map((it) => {
        const value: ApprovedPr = {
            pull_number: it.number,
            auto_merge: it.auto_merge,
            node_id: it.node_id,
            repo: it.base.repo.name,
        }
        return {
            title: it.base.repo.name + ' ' + it.title,
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

if (!response.approve || response.approve.length == 0) {
    console.log('Ingen PR valgt')
    process.exit()
}

response.approve.forEach(async (pr: ApprovedPr) => {
    if (pr.auto_merge == null) {
        await enablePullRequestAutoMerge(pr.node_id)
    }
    await approvePullrequest(pr)
})
