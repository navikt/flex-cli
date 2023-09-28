import * as Process from 'process'

import { config } from '../config/config.ts'
import { log } from '../common/log.ts'
import { getAllRepos } from '../common/get-all-repos.ts'

import { verifiserRepo } from './verifiserRepo'

export async function verifiserRepoer(patch: boolean) {
    log('\n\nVerifiserer alle repoer ')

    let ok = true

    const githubrepos = (await getAllRepos()).map((it) => it.name)
    for (const r of config.repos) {
        r.patch = patch
        const res = await verifiserRepo(r)
        log(`${r.name} er ${res ? 'ok' : 'ikke ok'}`)
        if (!res) {
            ok = false
        }
        if (!githubrepos.includes(r.name)) {
            log(`Repo ${r.name} finnes ikke på github`)
            ok = false
        }
    }

    for (const r of githubrepos) {
        if (!config.repos.find((it) => it.name === r)) {
            log(`Repo ${r} finnes ikke i config`)
            ok = false
        }
    }

    if (!ok) {
        log('\n\nFeil oppsett funnet')
        Process.exit(-1)
    }
    log('\n\nAlt ok')
}
