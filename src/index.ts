import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { klonAlle } from './actions/klon-alle.ts'
import { startDependabotMerge } from './actions/start-dependabot-merge.ts'
import { verifiserRepoer } from './actions/verifiser.ts'
import { resetAltTilMain } from './actions/reset-alt-til-main.ts'
import { resetAltTilMainNew } from './actions/reset-alt-til-main-new.ts'
import { branchCommitPush } from './actions/branch-commit-push.ts'
import { lastCommits } from './actions/last-commits.ts'
import { distrolessbump } from './actions/distrolessbump.ts'
import { secrets } from './actions/secrets.ts'
import { approvePr } from './actions/approvePr.ts'
import { slettGone } from './actions/slettGoneBranches.ts'
import { gradleBump } from './actions/gradlebump.ts'

await yargs(hideBin(process.argv))
    .scriptName('npm start')
    .command(
        'klon-alle',
        'Kloner alle repos til disk. Hvis repoet allerede finnes, klones det ikke på nytt.',

        async () => await klonAlle(),
    )
    .command(
        'approve-pr',
        'Approver pr er og labeler de med automerge',

        async () => await approvePr(),
    )
    .command(
        'start-auto-merge',
        'Starter dependabot automerging workflowen i alle repoer',
        async () => await startDependabotMerge(),
    )
    .command('secrets', 'Oppdaterer secrets i alle repoer', async () => await secrets())
    .command(
        'slett-gone',
        'sletter lokale branches som ikke lengre eksisterer på remote',
        async () => await slettGone(),
    )
    .command(
        'bcp',
        'Brancher, committer, pusher og lager pullrequest for lokale endringer i alle repoene som er på disk',
        async () => await branchCommitPush(),
    )
    .command(
        'distroless-bump',
        'Bumper distroless images til nyeste latest version',
        async () => await distrolessbump(),
    )
    .command('patch-repoer', 'Patcher github oppsettet i alle repoer', async () => await verifiserRepoer())
    .command(
        'reset-main',
        'Resetter alle repoer til main og fjerner lokale endringer',
        async () => await resetAltTilMain(),
    )
    .command(
        'reset-main-new',
        'Resetter alle repoer til main og fjerner lokale endringer',
        async () => await resetAltTilMainNew(),
    )
    .command('gradle-bump', 'Bumper gradle i alle repoer', async () => await gradleBump())
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
