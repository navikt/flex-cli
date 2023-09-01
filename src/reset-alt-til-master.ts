import { config } from './config'
import { execSync } from 'node:child_process'
import * as prompts from 'prompts'

const response = await prompts([
    {
        type: 'confirm',
        name: 'ok',
        message:
            'Denne kommandoen fjerner alle lokale endringer i flex repoer og resetter til master. Er du sikker?',
    },
])

if (!response.ok) {
    process.exit(1)
}

for (const r of config.repos) {
    if (r.name == 'flex-cli') {
        // skipper dette repoet
    } else {
        console.log(`Resetter ${r.name} til master`)
        execSync('git clean -f', {
            cwd: `../${r.name}`,
        })
        execSync(' git reset .', {
            cwd: `../${r.name}`,
        })
        execSync('git restore .', {
            cwd: `../${r.name}`,
        })
        execSync('git checkout master', {
            cwd: `../${r.name}`,
        })
        execSync('git pull', {
            cwd: `../${r.name}`,
        })
    }
}

console.log('\n\nAlt resatt til master')
