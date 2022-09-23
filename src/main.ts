import * as prompts from 'prompts'

import { verifiserRepo } from './verifiserRepo'
import { octokit } from './octokit'
import { approvePullrequest } from './approvePullrequest'
import { config } from './config'
import { ApprovedPr } from './types'
import { mergePullrequest } from './mergePullrequest'
import { sleep } from './sleep'
import { getCombinedSuccess } from './combinedStatus'

const inkluderRøde: boolean = (
    await prompts([
        {
            type: 'confirm',
            name: 'svar',
            message: 'Vil du også se pullrequests som ikke er bygd grønt ✅?',
        },
    ])
).svar

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

const filtrert = allePrs
    .filter(() => {
        //console.log(it)
        return true
    })
    .filter((it) => it.state == 'open')
    .filter((it) => it.user?.login == 'dependabot[bot]')

console.log(`Henter pullrequest status for ${filtrert.length} pull requests`)

const choices = (
    await Promise.all(
        filtrert.map((f) => {
            return new Promise<{ title: string; value: ApprovedPr }>(
                (resolve, reject) => {
                    getCombinedSuccess(config.owner, f.base.repo.name, f.number)
                        .then((checksOk) => {
                            const value: ApprovedPr = {
                                title: f.title,
                                pull_number: f.number,
                                repo: f.base.repo.name,
                                checksOk,
                            }
                            const status = checksOk ? '✅' : '❌'
                            resolve({
                                title: `${status}  ${f.base.repo.name} ${f.title}`,
                                value,
                            })
                        })
                        .catch(() => reject('oops'))
                }
            )
        })
    )
).filter((c) => {
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
