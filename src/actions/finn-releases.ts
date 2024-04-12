import { log } from '../common/log.ts'
import { config } from '../config/config.ts'
import { octokit } from './octokit.ts'

export async function finnReleases() {
    log('\n\nfinner releases ')


    const minerepoer = config.repos.map((it) => it.name)

    interface Package {
        repo: string
        package: string

    }

    const results = [] as Package[]
    let antall = 0

    // Loop and fetch all packages
    while (true) {
        //log hvad vi henter
        log(`Henter packages fra side ${antall / 100 + 1}`)
        const packages = await octokit.request('GET /orgs/{org}/packages', {
            org: 'navikt',
            package_type: 'npm',
            per_page: 100,
            page: antall / 100 + 1,
        })
        antall += packages.data.length
        log(`Hentet ${packages.data.length} packages`)
        packages.data.forEach((it) => {
            if (it.repository && minerepoer.includes(it.repository.name)) {
                results.push({ repo: it.repository.name, package: it.name })
            }
        })

        if (packages.data.length < 100) {
            console.log('Ferdig med å hente packages')
            break
        }
    }

    console.log(results)
    console.log(JSON.stringify(results, null, 2))


    const path = './releases.json'
    await Bun.write(path, JSON.stringify(results, null, 2))
    log('\n\nFerdig')
}
