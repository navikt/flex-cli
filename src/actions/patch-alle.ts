import { config } from '../config/config'
import { log } from '../common/log.ts'

import { verifiserRepo } from './verifiserRepo'

export async function patchAlle() {
    log('\n\nPatcher alle repoer ')

    for (const r of config.repos) {
        r.patch = true
        await verifiserRepo(r)
        log(`${r.name} er patchet`)
    }

    log('\n\nAlt patchet')
}
