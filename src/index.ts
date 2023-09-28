import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { klonAlle } from './actions/klon-alle.ts'
import { startDependabotMerge } from './actions/start-dependabot-merge.ts'
import { verifiserRepoer } from './actions/verifiser.ts'
import { patchAlle } from './actions/patch-alle.ts'
import { resetAltTilMaster } from './actions/reset-alt-til-master.ts'
import { branchCommitPush } from './actions/branch-commit-push.ts'
import { lastCommits } from './actions/last-commits.ts'

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
    .command('bcp', 'Brancher, committer, pusher og lager pullrequest for', async () => await branchCommitPush())
    .command('patch-repoer', 'Verifiserer og patcher oppsettet i alle repoer', async () => await patchAlle())
    .command('verifiser-repoer', 'Verifiserer oppsettet i alle repoer', async () => await verifiserRepoer())
    .command('reset-master', 'Resetter alle repoer til master', async () => await resetAltTilMaster())
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
