import { config } from './config'
import { verifiserRepo } from './verifiserRepo'
import { octokit } from './octokit'
import { ApprovedPr } from './types'
import { getCombinedSuccess } from './combinedStatus'

export async function hentPullrequests() {
    console.log('\n\nVerifiserer repo status')

    await Promise.all(config.repos.map((r) => verifiserRepo(r)))
    console.log('\n\nHenter alle dependabot PRs')

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

    console.log(
        `Henter pullrequest status for ${filtrert.length} pull requests`
    )

    return await Promise.all(
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
}
