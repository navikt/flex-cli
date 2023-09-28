import { Octokit } from '@octokit/rest'
import { config } from 'dotenv'

config()
if (!process.env.GITHUB_PAT) {
    throw Error('Missing env GITHUB_PAT')
}

export const octokit = new Octokit({
    auth: process.env.GITHUB_PAT,
})
