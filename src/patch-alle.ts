import { verifiserRepo } from './verifiserRepo'
import { config } from './config'

console.log('\n\nPatcher alle repoer ')

for (const r of config.repos) {
    r.patch = true
    await verifiserRepo(r)
    console.log(`${r.name} er patchet`)
}

console.log('\n\nAlt patchet')
