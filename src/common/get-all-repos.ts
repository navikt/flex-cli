import chalk from 'chalk'

import { ghGqlQuery, OrgTeamRepoResult, removeIgnoredAndArchived } from '../common/octokit.ts'
import { log } from '../common/log.ts'

type RepoWithBranch = { defaultBranchRef: { name: string } }

const reposQuery = /* GraphQL */ `
    query ($team: String!) {
        organization(login: "navikt") {
            team(slug: $team) {
                repositories(orderBy: { field: PUSHED_AT, direction: ASC }) {
                    nodes {
                        name
                        isArchived
                        pushedAt
                        url
                        defaultBranchRef {
                            name
                        }
                    }
                }
            }
        }
    }
`

export async function getAllRepos() {
    log(chalk.green(`Getting all active repositories for team flex...`))

    const result = await ghGqlQuery<OrgTeamRepoResult<RepoWithBranch>>(reposQuery, {
        team: 'flex',
    })

    return removeIgnoredAndArchived(result.organization.team.repositories.nodes)
}
