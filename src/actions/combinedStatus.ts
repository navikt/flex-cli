import { octokit } from './octokit'

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

export async function getCombinedSuccess(owner: string, repo: string, pull_number: string) {
    try {
        const result: any = await octokit.graphql(QUERY, {
            owner,
            repo,
            pull_number,
        })
        const [{ commit: lastCommit }] = result.repository.pullRequest.commits.nodes
        return lastCommit.statusCheckRollup?.state === 'SUCCESS'
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Fikk ikke henta status for ${repo} ${pull_number}`, e)
        return false
    }
}
