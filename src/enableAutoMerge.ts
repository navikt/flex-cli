import { octokit } from './octokit'

export async function enablePullRequestAutoMerge(node_id: string) {
    const query = `mutation enableAutoMerge($pullId: ID!, $mergeMethod: PullRequestMergeMethod) {
      enablePullRequestAutoMerge(input: {
        pullRequestId: $pullId,
        mergeMethod: $mergeMethod,
      }) {
        pullRequest {
          id,
          autoMergeRequest {
            enabledAt
          }
        }
      }
    }`
    const variables = {
        pullId: node_id,
        mergeMethod: 'SQUASH',
    }
    const result = (await octokit.graphql(query, variables)) as any

    if (result.errors && result.errors.length > 0) {
        throw result.errors[0].message
    }

    if (!result.enablePullRequestAutoMerge) {
        throw 'unexpected error'
    }
}
