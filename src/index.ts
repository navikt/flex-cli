import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { klonAlle } from './actions/klon-alle.ts'
import { startDependabotMerge } from './actions/start-dependabot-merge.ts'
import { verifiserRepoer } from './actions/verifiser.ts'
import { resetAltTilMaster } from './actions/reset-alt-til-master.ts'
import { branchCommitPush } from './actions/branch-commit-push.ts'
import { lastCommits } from './actions/last-commits.ts'
import { distrolessbump } from './actions/distrolessbump.ts'
import { secrets } from './actions/secrets.ts'

await yargs(hideBin(process.argv))
    .scriptName('npm start')
    .command(
        'klon-alle',
        'Kloner alle repos til disk. Hvis repoet allerede finnes, klones det ikke på nytt.',

        async () => await klonAlle(),
    )
    .command(
        'start-auto-merge',
        'Starter dependabot automerging workflowen i alle repoer',
        async () => await startDependabotMerge(),
    )
    .command('secrets', 'Oppdaterer secrets i alle repoer', async () => await secrets())
    .command(
        'bcp',
        'Brancher, committer, pusher og lager pullrequest for lokale endringer i alle repoene som er på disk',
        async () => await branchCommitPush(),
    )
    .command('distrolessbump', 'Bumper distroless images til nyeste latest version', async () => await distrolessbump())
    .command('patch-repoer', 'Patcher github oppsettet i alle repoer', async () => await verifiserRepoer())
    .command(
        'reset-master',
        'Resetter alle repoer til master og fjerner lokale endringer',
        async () => await resetAltTilMaster(),
    )
    .command(
        'commits',
        'get the last commits for every repo in the team',
        (yargs) =>
            yargs
                .positional('order', {
                    type: 'string',
                    default: 'desc',
                    describe: 'the order the commits should be sorted in',
                    choices: ['asc', 'desc'],
                })
                .positional('limit', {
                    type: 'number',
                    default: undefined,
                    describe: 'the number of commits to return',
                }),
        async (args) => lastCommits(args.order as 'asc' | 'desc', args.limit),
    )
    .demandCommand()
    .strict()
    .parse()
