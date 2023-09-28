import prompts from 'prompts'

import { log } from '../common/log.ts'

import { labelPrForAutoMerge } from './labelPrForAutoMerge'
import { hentPullrequests } from './hentPullrequests'

const inkluderRøde: boolean = (
    await prompts([
        {
            type: 'confirm',
            name: 'svar',
            message: 'Vil du også se pullrequests som ikke er bygd grønt ✅?',
        },
    ])
).svar

const choices = (await hentPullrequests()).filter((c) => {
    if (inkluderRøde) {
        return true
    }
    return c.value.checksOk
})

if (choices.length == 0) {
    log('Ingen PR å behandle')
    process.exit()
}

const response = await prompts([
    {
        type: 'autocompleteMultiselect',
        name: 'approve',
        message: 'Hvilke pullrequests skal godkjennes?',
        choices,
    },
])

if (!response.approve || response.approve.length == 0) {
    log('Ingen PR valgt')
    process.exit()
}

async function behandlePr(pr: any) {
    await labelPrForAutoMerge(pr)
    log(`${pr.repo} ${pr.title} lablet med automerge`)
}

for (const pr of response.approve) {
    await behandlePr(pr)
}
