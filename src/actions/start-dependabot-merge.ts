import { config } from '../config/config'
import { log } from '../common/log.ts'

import { octokit } from './octokit'

export async function startDependabotMerge() {
    log('\n\nStarter dependabot i alle repoer ')

    for (const r of config.repos) {
        try {
            await octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
                owner: config.owner,
                repo: r.name,
                workflow_id: 'merge-dependabot-pr.yml',
                ref: 'master',
            })
            log(`Startet workflow i ${r.name}`)
        } catch (e: any) {
            if (!(e.status == 404 || e.status == 422)) {
                log('Kunne ikke starte workflow i ' + r.name, e)
            } else {
                log(`Startet ikke workflow i ${r.name}`)
            }
        }
    }

    log('\n\nAlt startet')
}
