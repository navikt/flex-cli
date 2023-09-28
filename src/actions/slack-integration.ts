import { config } from '../config/config'
import { log } from '../common/log.ts'

log('')

config.repos.forEach((repo) => {
    log(`/github subscribe ${config.owner}/${repo.name}`)
})
log('')

config.repos.forEach((repo) => {
    log(`/github unsubscribe ${config.owner}/${repo.name} issues pulls releases deployments`)
})
log('')
log('')
