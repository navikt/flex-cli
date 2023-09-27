import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { klonAlle } from './klon-alle.ts'
import { startDependabotMerge } from './start-dependabot-merge.ts'
import { verifiserRepoer } from './verifiser.ts'

await yargs(hideBin(process.argv))
    .scriptName('npm start')
    .command(
        'klon-alle',
        'Kloner alle repos i teamet',

        async () => await klonAlle(),
    )
    .command(
        'start-auto-merge',
        'Starter dependabot automerging i alle repoer',
        async () => await startDependabotMerge(),
    )
    .command('verifiser-repoer', 'Verifiserer oppsettet i alle repoer', async () => await verifiserRepoer())
    .demandCommand()
    .strict()
    .parse()
