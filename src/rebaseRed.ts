import { hentPullrequests } from './hentPullrequests'
import { octokit } from './octokit'
import { config } from './config'

const red = (await hentPullrequests()).filter((c) => !c.value.checksOk)

console.log(`Fant ${red.length} røde pullrequests som vi ber dependabot rebase`)

red.forEach(async (r) => {
    await octokit.rest.issues.createComment({
        owner: config.owner,
        repo: r.value.repo,
        issue_number: r.value.pull_number,
        body: '@dependabot rebase',
    })
    console.log('Ba dependabot rebase ' + r.title)
})

console.log('Ferdig')
