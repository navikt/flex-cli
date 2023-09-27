import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { klonAlle } from './klon-alle.ts'

await yargs(hideBin(process.argv))
    .scriptName('npm start')
    .command(
        'klon-alle',
        'Kloner alle repos i teamet',

        async () => await klonAlle()
    )
    .demandCommand()
    .strict()
    .parse()
