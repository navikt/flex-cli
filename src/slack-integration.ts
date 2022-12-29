import { config } from './config'

console.log('')

config.repos.forEach((repo) => {
    console.log(`/github subscribe ${config.owner}/${repo.name}`)
})
console.log('')

config.repos.forEach((repo) => {
    console.log(
        `/github unsubscribe ${config.owner}/${repo.name} issues pulls releases deployments`
    )
})
console.log('')
console.log('')
