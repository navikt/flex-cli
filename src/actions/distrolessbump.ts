import * as YAML from 'yaml'
import prompts from 'prompts'

import { log } from '../common/log.ts'
import { getAllRepos } from '../common/get-all-repos.ts'

import { branchCommitPushAuto } from './branch-commit-push.ts'

export async function distrolessbump() {
    log('Distroless bumping')
    const distrolessConfigFil = await Bun.file('./distroless.yml').text()

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
    const pullok = await prompts([
        {
            type: 'confirm',
            name: 'ok',
            message: `Har du husket å pulle alle repoene og satt til master?`,
        },
    ])
    if (!pullok.ok) {
        log('Husk å pulle alle repoene og sett til master')
        process.exit(1)
    }

    for (const r of distrolessconfig.distroless) {
        const oppgradere = await prompts([
            {
                type: 'confirm',
                name: 'ok',
                message: `Vil du oppgradere distrolessimagene ${r.image}?`,
            },
        ])
        if (oppgradere.ok) {
            const response = await fetch(`https://gcr.io/v2/distroless/${r.image}/tags/list`)
            const res = await response.json<DistrolessTags>() // HTML string
            let latestSha: string | null = null

            for (const sha in res.manifest) {
                if (res.manifest[sha].tag.includes('latest')) {
                    latestSha = sha
                    break // Break out of loop once we find the 'latest' tag
                }
            }
            if (!latestSha) {
                log(`Fant ikke latest tag for ${r.image}`)
                process.exit(1)
            }
            const image = `gcr.io/distroless/${r.image}@${latestSha}`
            log(image)

            for (const app of r.appname) {
                log(`Redigerer Dockerfile i ${app}`)
                const dockerfilePath = `../${app}/Dockerfile`
                const dockerfile = (await Bun.file(dockerfilePath).text())
                    .split('\n')
                    .map((it) => {
                        if (it.startsWith('FROM')) {
                            return `FROM ${image}`
                        }
                        return it
                    })
                    .join('\n')
                await Bun.write(dockerfilePath, dockerfile)
            }

            await branchCommitPushAuto(
                `dev-${r.image}-${latestSha.replace('sha256:', '').substring(0, 8)}-${Math.floor(Math.random() * 100)}`,
                `Oppgraderer Distroless til ${r.image}@${latestSha?.substring(0, 15)}`,
                r.appname,
            )
        }
    }

    log('\n\nFerdig')
}

interface DistrolessConfig {
    distroless: {
        image: string
        appname: string[]
    }[]
    ignore: string[]
}

interface DistrolessTags {
    manifest: {
        [key: string]: Tag
    }
}

export interface Tag {
    imageSizeBytes: string
    layerId: string
    mediaType: string
    tag: string[]
    timeCreatedMs: string
    timeUploadedMs: string
}
