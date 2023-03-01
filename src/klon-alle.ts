import { config } from './config'
import { execSync } from 'node:child_process'

console.log('\n\nKloner flex repoer til parent mappen ')
const eksisterende = execSync('ls ..').toString()

for (const r of config.repos) {
    if (eksisterende.includes(r.name)) {
        console.log(`${r.name} eksisterer allerede`)
        continue
    }
    const res = execSync(`git clone git@github.com:navikt/${r.name}.git`, {
        cwd: '..',
    })
    console.log(res.toString())
}

console.log('\n\nAlt klonet')
