import { verifiserRepo } from './verifiserRepo'
import { config } from './config'
import { hentAntallOrgAdmins } from './orgAdmins'

console.log('\n\nPatcher alle repoer ')

const antallAdmins = await hentAntallOrgAdmins()

for (const r of config.repos) {
    r.patch = true
    await verifiserRepo(r, antallAdmins)
    console.log(`${r.name} er patchet`)
}

console.log('\n\nAlt patchet')
