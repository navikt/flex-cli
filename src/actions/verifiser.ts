import { config } from '../config/config.ts'
import { log } from '../common/log.ts'
import { getAllRepos } from '../common/get-all-repos.ts'

import { verifiserRepo } from './verifiserRepo'

export async function verifiserRepoer() {
    log('\n\nVerifiserer alle repoer ')

    const githubrepos = (await getAllRepos()).map((it) => it.name)
    for (const r of config.repos) {
        log(`${r.name}`)
        if (!githubrepos.includes(r.name)) {
            log(`Repo ${r.name} finnes ikke på github`)
        }
        await verifiserRepo(r)
    }

    for (const r of githubrepos) {
        if (!config.repos.find((it) => it.name === r)) {
            log(`Repo ${r} finnes ikke i config`)
        }
    }

    log('\n\nFerdig')
}
