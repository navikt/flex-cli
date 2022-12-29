import { config } from './config'
import { octokit } from './octokit'

console.log('\n\nStarter dependabot i alle repoer ')

for (const r of config.repos) {
    try {
        await octokit.request(
            'POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches',
            {
                owner: config.owner,
                repo: r.name,
                workflow_id: 'merge-dependabot-pr.yml',
                ref: 'master',
            }
        )
        console.log(`Startet workflow i ${r.name}`)
    } catch (e: any) {
        if (!(e.status == 404 || e.status == 422)) {
            console.log('Kunne ikke starte workflow i ' + r.name, e)
        } else {
            console.log(`Startet ikke workflow i ${r.name}`)
        }
    }
}

console.log('\n\nAlt startet')
