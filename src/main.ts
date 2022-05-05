import * as prompts from 'prompts'

import { verifiserRepo } from './verifiserRepo'
import { octokit } from './octokit'
import { approvePullrequest } from './approvePullrequest'
import { enablePullRequestAutoMerge } from './enableAutoMerge'
import { config } from './config'
import { ApprovedPr, RepoConfig } from './types'
import { mergePullrequest } from './mergePullrequest'

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

await Promise.all(repoerTilBehandling.map((r) => verifiserRepo(r)))

const pulls = await Promise.all(
    repoerTilBehandling.map((r) =>
        octokit.request('GET /repos/{owner}/{repo}/pulls', {
            owner: config.owner,
            repo: r.name,
        })
    )
)

const allePrs = pulls.reduce(
    (accumulator, value) => accumulator.concat(value.data),
    [] as any[]
)

const choices = allePrs
    .filter(() => {
        //console.log(it)
        return true
    })
    .filter((it) => it.state == 'open')
    .filter((it) => it.user?.login == 'dependabot[bot]')
    .map((it) => {
        const value: ApprovedPr = {
            title: it.title,
            pull_number: it.number,
            auto_merge: it.auto_merge,
            node_id: it.node_id,
            repo: it.base.repo.name,
            mergeable_state: it.mergeable_state,
            rebaseable: it.rebaseable,
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

for (const pr of response.approve) {
    const prData = await octokit.request(
        'GET /repos/{owner}/{repo}/pulls/{pull_number}',
        {
            owner: config.owner,
            repo: pr.repo,
            pull_number: pr.pull_number,
        }
    )

    if (prData.data.mergeable_state != 'clean') {
        try {
            console.log('Automerger ' + pr.repo + ' ' + pr.title)
            await enablePullRequestAutoMerge(pr.node_id)
        } catch (e) {
            console.log('Feil ved enable av automerge', e)
        }
        console.log('Approver ' + pr.repo + ' ' + pr.title)

        await approvePullrequest(pr)
    } else if (prData.data.mergeable_state == 'clean') {
        await mergePullrequest(pr)
    } else {
        console.log(
            'Gjør ingenting med ' +
                pr.repo +
                ' ' +
                pr.title +
                ' grunnet mergablestate ' +
                prData.data.mergeable_state
        )
        console.log(prData.data.auto_merge)
    }
}
