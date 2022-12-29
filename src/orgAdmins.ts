import { octokit } from './octokit'
import { config } from './config'

export async function hentAntallOrgAdmins() {
    return (
        await octokit.request('GET /orgs/{org}/members{?role}', {
            org: config.owner,
            role: 'admin',
        })
    ).data.length
}
