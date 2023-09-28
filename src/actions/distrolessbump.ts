import fs from 'fs'

import * as YAML from 'yaml'

import { log } from '../common/log.ts'
import { getAllRepos } from '../common/get-all-repos.ts'

export async function distrolessbump() {
    log('Distroless bumping')
    const distrolessConfigFil = fs.readFileSync('./distroless.yml', 'utf8')

    const githubrepos = (await getAllRepos()).map((it) => it.name)

    const distrolessconfig = YAML.parse(distrolessConfigFil) as DistrolessConfig
    const alleRepos = distrolessconfig.distroless.map((it) => it.appname).flat()
    distrolessconfig.ignore.forEach((it) => {
        alleRepos.push(it)
    })
    for (const r of githubrepos) {
        if (!alleRepos.includes(r)) {
            log(`Repo ${r} finnes ikke i distroless.yml`)
            process.exit(1)
        }
    }
    for (const r of alleRepos) {
        if (!githubrepos.includes(r)) {
            log(`Repo ${r} finnes ikke på github`)
            process.exit(1)
        }
    }

    log('\n\nAlt ok')
}

interface DistrolessConfig {
    distroless: {
        image: string
        appname: string[]
    }[]
    ignore: string[]
}
