import * as prompts from 'prompts'

import { verifiserRepo } from './verifiserRepo'
import { octokit } from './octokit'
import { approvePullrequest } from './approvePullrequest'
import { config } from './config'
import { ApprovedPr } from './types'
import { mergePullrequest } from './mergePullrequest'
import { sleep } from './sleep'

console.log('\n\nHenter alle dependabot PRs')

await Promise.all(config.repos.map((r) => verifiserRepo(r)))

const pulls = await Promise.all(
    config.repos.map((r) =>
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
        type: 'autocompleteMultiselect',
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
    let retries = 10
    let prData = await octokit.request(
        'GET /repos/{owner}/{repo}/pulls/{pull_number}',
        {
            owner: config.owner,
            repo: pr.repo,
            pull_number: pr.pull_number,
        }
    )
    const reviews = await octokit.request(
        'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews',
        {
            owner: config.owner,
            repo: pr.repo,
            pull_number: pr.pull_number,
        }
    )
    if (
        prData.data.mergeable == false ||
        !reviews.data.some((r) => r.state == 'APPROVED')
    ) {
        await approvePullrequest(pr)
    }
    while (retries > 0 && prData.data.mergeable != true) {
        prData = await octokit.request(
            'GET /repos/{owner}/{repo}/pulls/{pull_number}',
            {
                owner: config.owner,
                repo: pr.repo,
                pull_number: pr.pull_number,
            }
        )
        retries--
        await sleep(100)
    }

    if (prData.data.mergeable == true) {
        await mergePullrequest(pr)
    } else {
        console.log(
            `Gjør ingenting med ${pr.repo} ${pr.title} grunnet mergeable ${prData.data.mergeable}`
        )
        console.log('Ta en titt på ' + prData.data.html_url)
        if (prData.data.mergeable_state == 'dirty') {
            console.log('Ber dependabot rebase')
            await octokit.rest.issues.createComment({
                owner: config.owner,
                repo: pr.repo,
                issue_number: pr.pull_number,
                body: '@dependabot rebase',
            })
        }
    }
}
