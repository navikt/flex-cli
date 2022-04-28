import * as fs from 'fs'
import * as YAML from 'yaml'
import { Config } from './types'

const file = fs.readFileSync('./config.yml', 'utf8')
export const config = YAML.parse(file) as Config
