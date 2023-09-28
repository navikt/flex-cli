import { execSync } from 'node:child_process'

import prompts from 'prompts'

import { config } from '../config/config'
import { log } from '../common/log.ts'

export async function klonAlle() {
    log('\n\nKloner flex repoer til parent mappen ')
    const eksisterende = execSync('ls ..').toString()

    const response = await prompts([
        {
            type: 'select',
            name: 'git',
            message: 'Bruker du git eller Github CLI (gh)',
            choices: [
                { title: 'git', value: 'git' },
                { title: 'Github CLI', value: 'gh' },
            ],
        },
    ])

    for (const r of config.repos) {
        if (eksisterende.includes(r.name)) {
            log(`${r.name} eksisterer allerede`)
            continue
        }
        if (response.git === 'git') {
            const res = execSync(`git clone git@github.com:navikt/${r.name}.git`, {
                cwd: '..',
            })
            log(res.toString())
        }
        if (response.git === 'gh') {
            const res = execSync(`gh repo clone navikt/${r.name}`, {
                cwd: '..',
            })
            log(res.toString())
        }
    }

    log('\n\nAlt klonet')
}
