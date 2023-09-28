import { config } from '../config/config'
import { log } from '../common/log.ts'

import { hentPullrequests } from './hentPullrequests'
import { octokit } from './octokit'

const red = (await hentPullrequests()).filter((c) => !c.value.checksOk)

log(`Fant ${red.length} røde pullrequests som vi ber dependabot rebase`)

red.forEach(async (r) => {
    await octokit.rest.issues.createComment({
        owner: config.owner,
        repo: r.value.repo,
        issue_number: r.value.pull_number,
        body: '@dependabot rebase',
    })
    log('Ba dependabot rebase ' + r.title)
})

log('Ferdig')
