import * as prompts from 'prompts'

import { octokit } from './octokit'
import { approvePullrequest } from './approvePullrequest'
import { config } from './config'
import { mergePullrequest } from './mergePullrequest'
import { sleep } from './sleep'
import { hentPullrequests } from './hentPullrequests'

const inkluderRøde: boolean = (
    await prompts([
        {
            type: 'confirm',
            name: 'svar',
            message: 'Vil du også se pullrequests som ikke er bygd grønt ✅?',
        },
    ])
).svar

const choices = (await hentPullrequests()).filter((c) => {
    if (inkluderRøde) {
        return true
    }
    return c.value.checksOk
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

async function behandlePr(pr: any) {
    if (pr.checksOk == false) {
        const bekreft = await prompts([
            {
                type: 'confirm',
                name: 'svar',
                message: `${pr.repo} ${pr.title} har feilet status sjekker, sikker på at du vil merge?`,
                choices,
            },
        ])
        if (bekreft.svar == false) {
            return
        }
    }

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

for (const pr of response.approve) {
    await behandlePr(pr)
}
