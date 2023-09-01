import { config } from './config'
import { execSync } from 'node:child_process'
import * as prompts from 'prompts'

const response = await prompts([
    {
        type: 'confirm',
        name: 'ok',
        message: 'Denne kom resetter til master. Er du sikker?',
    },
])

if (!response.ok) {
    process.exit(1)
}
console.log(response.ok)

for (const r of config.repos) {
    if (r.name == 'flex-cli') {
        // skipper dette repoet
    } else {
        let endringer = false
        try {
            execSync('git diff-index --quiet HEAD', {
                cwd: `../${r.name}`,
            })
        } catch (e: any) {
            endringer = true
        }
        if (endringer) {
            console.log('Fant endringer i ' + r.name)
        } else {
            console.log('Fant ingen endringer i ' + r.name)
        }
    }
}

console.log('\n\nAlt resatt til master')
