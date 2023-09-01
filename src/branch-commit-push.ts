import { config } from './config'
import { execSync } from 'node:child_process'
import * as prompts from 'prompts'

const commit = await prompts([
    {
        type: 'text',
        name: 'melding',
        message: 'Hvilken commit melding vil du gi?',
    },
])

if (!commit.melding) {
    process.exit(1)
}
const branchNavn = await prompts([
    {
        type: 'text',
        name: 'branch',
        message: 'Hva skal branchnavnet være?',
    },
])

if (!branchNavn.branch) {
    process.exit(1)
}

const repoerMedEndringer: string[] = []
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
            execSync(`git checkout -b ${branchNavn.branch}`, {
                cwd: `../${r.name}`,
            })
            execSync('git add .', {
                cwd: `../${r.name}`,
            })
            execSync(`git commit -m "${commit.melding}"`, {
                cwd: `../${r.name}`,
            })
            execSync('git push', {
                cwd: `../${r.name}`,
            })
            repoerMedEndringer.push(r.name)
        } else {
            console.log('Fant ingen endringer i ' + r.name)
        }
    }
}

if (repoerMedEndringer.length == 0) {
    console.log('Ingen endringer å lage PR for')
    process.exit(1)
}

const lagPr = await prompts([
    {
        type: 'confirm',
        name: 'ok',
        message: `Vil du lage PR for endringene i ${repoerMedEndringer.join(
            ', '
        )}?`,
    },
])

if (!lagPr.ok) {
    process.exit(1)
}

for (const r of repoerMedEndringer) {
    console.log('Lager PR for ' + r)
    execSync(`gh pr create --title "${commit.melding}" --body "Fra flex-cli"`, {
        cwd: `../${r}`,
    })
}

const automerge = await prompts([
    {
        type: 'confirm',
        name: 'ok',
        message: `Vil du automerge endringene i ${repoerMedEndringer.join(
            ', '
        )} til master slik at det går i produksjon?`,
    },
])

if (!automerge.ok) {
    process.exit(1)
}

for (const r of repoerMedEndringer) {
    console.log('Automerger PR for ' + r)
    execSync('gh pr merge --auto -s', {
        cwd: `../${r}`,
    })
}
