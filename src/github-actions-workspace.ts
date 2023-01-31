import { octokit } from './octokit'

const github = octokit
const context = {
    repo: {
        owner: 'navikt',
        repo: 'sykepengesoknad-backend',
    },
}

// Kode nedenfor kan kjøres som en action hvis man fjerner :any

const pulls = await github.request('GET /repos/{owner}/{repo}/pulls', {
    owner: context.repo.owner,
    repo: context.repo.repo,
})

const filtrert = pulls.data
    .filter((it) => it.state == 'open')
    .filter((it) => it.user?.login == 'dependabot[bot]')
    .filter((it) => {
        const prCreated = new Date(it.created_at)
        if (it.title.includes('navikt')) {
            const twoDays = 2 * 24 * 60 * 60 * 1000
            return prCreated.getTime() < Date.now() - twoDays
        }
        const oneWeek = 7 * 24 * 60 * 60 * 1000
        return prCreated.getTime() < Date.now() - oneWeek
    })
    .filter((it) => it.labels.some((l) => l.name == 'automerge'))
    .map((it) => {
        return {
            title: it.title,
            number: it.number,
        }
    })
    .map(async (it) => {
        const QUERY = `query($owner: String!, $repo: String!, $pull_number: Int!) {
                              repository(owner: $owner, name:$repo) {
                                pullRequest(number:$pull_number) {
                                  commits(last: 1) {
                                    nodes {
                                      commit {
                                        statusCheckRollup {
                                          state
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }`

        const result: any = await github.graphql(QUERY, {
            owner: context.repo.owner,
            repo: context.repo.repo,
            pull_number: it.number,
        })
        const [{ commit: lastCommit }] =
            result.repository.pullRequest.commits.nodes

        return {
            title: it.title,
            number: it.number,
            checksOk: lastCommit.statusCheckRollup?.state === 'SUCCESS',
        }
    })

const allePrs = await Promise.all(filtrert)
const medMergeablePromise = allePrs
    .filter((it) => it.checksOk)
    .map(async (it) => {
        const prdata = await github.request(
            'GET /repos/{owner}/{repo}/pulls/{pull_number}',
            {
                owner: context.repo.owner,
                repo: context.repo.repo,
                pull_number: it.number,
            }
        )
        return {
            title: it.title,
            number: it.number,
            mergeable: prdata.data.mergeable,
        }
    })
const medMergeable = await Promise.all(medMergeablePromise)
if (medMergeable.length > 0) {
    const pr = medMergeable[0]
    console.log('Merger PR', pr.title)
    await octokit.request(
        'PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge',
        {
            owner: context.repo.owner,
            repo: context.repo.repo,
            pull_number: pr.number,
            merge_method: 'squash',
        }
    )
    console.log('Starter master workflow')

    await octokit.request(
        'POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches',
        {
            owner: context.repo.owner,
            repo: context.repo.repo,
            workflow_id: 'workflow.yml',
            ref: 'master',
        }
    )
} else {
    console.log('Ingen PRer å merge')
}
