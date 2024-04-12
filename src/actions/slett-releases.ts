import { log } from '../common/log.ts'
import { octokit } from './octokit.ts'

export async function slettReleases() {
    log('\n\nSletter releases ')

    const releases = await Bun.file('./releases.json').text()
    const releasesJson = JSON.parse(releases) as { repo: string; package: string }[]

    for (const release of releasesJson) {
        log(`Sletter release ${release.package} for repo ${release.repo}`)

        // Slett release
        await octokit.request('DELETE /orgs/{org}/packages/{package_type}/{package_name}', {
            package_type: 'npm',
            package_name: release.package,
            org: 'navikt',
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })
    }

}
