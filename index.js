'use strict'

const script = require.resolve('./dist/checkout.js')
const spawn = require('child_process').spawn
const fsp = require('fs').promises
const path = require('path')

async function main () {
  const items = (process.env.INPUT_REPOSITORIES || '').split(/\s+/).filter(Boolean)
  const workspace = path.resolve(process.env.GITHUB_WORKSPACE || '.')
  const basedir = path.resolve(workspace, process.env.INPUT_PATH || '..')
  const env = {}

  for (const k in process.env) {
    if (!/^INPUT_(REPOSITORIES|REPOSITORY|REF|PATH|PERSIST.CREDENTIALS)$/i.test(k)) {
      env[k] = process.env[k]
    }
  }

  for (const item of items) {
    const [repository, ref, ...a] = item.split('@')
    const [owner, name, ...b] = repository.split('/')

    if (!owner || !name || a.length || b.length) {
      throw new Error('Repository must be in the form of "owner/name[@ref]"')
    }

    const dir = path.join(basedir, repository)
    const parent = path.dirname(dir)
    const gitignore = path.join(parent, '.gitignore')

    await fsp.mkdir(parent, { recursive: true })
    await fsp.appendFile(gitignore, '\n' + name)

    await exec(process.execPath, [script], {
      env: {
        ...env,
        INPUT_REPOSITORY: repository,
        INPUT_REF: ref || '',
        INPUT_PATH: dir,
        'INPUT_PERSIST-CREDENTIALS': 'false',

        // Circumvent actions/checkout restriction that
        // INPUT_PATH must be under workspace
        GITHUB_WORKSPACE: path.dirname(workspace),

        // Unset variables that might be used as defaults
        GITHUB_REPOSITORY: repository,
        GITHUB_SHA: '',
        GITHUB_REF: ref || '',
        GITHUB_HEAD_REF: '',
        GITHUB_BASE_REF: ''
      },
      stdio: ['ignore', 1, 1]
    })
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

async function exec (command, args, options) {
  return new Promise(function (resolve, reject) {
    const cp = spawn(command, args, options)

    cp.on('error', reject)
    cp.on('close', function (code) {
      if (code !== 0) {
        reject(new Error(`Child process exited with code ${code}`))
      } else {
        resolve()
      }
    })
  })
}
