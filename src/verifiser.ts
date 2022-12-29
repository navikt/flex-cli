import { verifiserRepo } from './verifiserRepo'
import { config } from './config'
import * as Process from 'process'
import { hentAntallOrgAdmins } from './orgAdmins'

console.log('\n\nVerifiserer alle repoer ')

let ok = true

const antallAdmins = await hentAntallOrgAdmins()

for (const r of config.repos) {
    r.patch = false
    const res = await verifiserRepo(r, antallAdmins)
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
