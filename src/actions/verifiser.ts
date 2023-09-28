import * as Process from 'process'

import { config } from '../config/config.ts'

import { verifiserRepo } from './verifiserRepo'

export async function verifiserRepoer() {
    console.log('\n\nVerifiserer alle repoer ')

    let ok = true

    for (const r of config.repos) {
        r.patch = false
        const res = await verifiserRepo(r)
        console.log(`${r.name} er ${res ? 'ok' : 'ikke ok'}`)
        if (!res) {
            ok = false
        }
    }

    if (!ok) {
        console.log('\n\nFeil oppsett funnet')
        Process.exit(-1)
    }
    console.log('\n\nAlt ok')
}
