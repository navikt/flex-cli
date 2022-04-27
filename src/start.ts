import * as prompts from 'prompts'

import { Octokit } from '@octokit/rest'
import { config } from 'dotenv'
import { owner } from './owner'

console.log('\n\n\n')
config()
if (!process.env.GITHUB_PAT) {
    throw Error('Missing env GITHUB_PAT')
}

const octokit = new Octokit({
    auth: process.env.GITHUB_PAT,
})

const repo = 'flex-testdata-reset'


const pulls = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
    owner,
    repo,
})


const choices = pulls.data.map((it) => {
    return {
        title: it.title,
        value: { number: it.number }
    }
})

const response = await prompts([
    {
        type: 'multiselect',
        name: 'pr',
        message: 'Godkjenn PRs',
        choices
    }
])

await octokit.request('POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
    owner,
    repo,
    pull_number: response.pr.number,
    body: 'Godkjent med flex-github-tools',
    event: 'APPROVE'
})
/*
async function enablePullRequestAutoMerge(pullId: number) {
    const query = `mutation($pullId: ID!, $mergeMethod: PullRequestMergeMethod!, $authorEmail: String!, $commitHeadline: String!, $commitBody: String) {
        enablePullRequestAutoMerge(input: {pullRequestId: $pullId, authorEmail: $authorEmail, commitBody: $commitBody, commitHeadline: $commitHeadline, mergeMethod: $mergeMethod}) {
          __typename
        }
      }`
    const variables = {
        pullId: pullId,
        mergeMethod: 'SQUASH'
    }
    const result = await octokit.graphql(query, variables) as any

    if (result.errors && result.errors.length > 0) {
        throw result.errors[0].message
    }

    if (!result.enablePullRequestAutoMerge) {
        throw 'unexpected error'
    }
}

*/
