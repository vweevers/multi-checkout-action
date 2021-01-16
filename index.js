'use strict'

const checkout = require.resolve('./dist/checkout.js')
const spawn = require('child_process').spawn
const path = require('path')

async function main () {
  const items = (process.env.INPUT_REPOSITORIES || '').split(/[\r\n]+/).filter(Boolean)
  const basedir = process.env.INPUT_PATH || '..'
  const debug = {}
  const env = {}

  for (const k in process.env) {
    if (!/^INPUT_(REPOSITORIES|REPOSITORY|REF|PATH|PERSIST.CREDENTIALS)$/i.test(k)) {
      env[k] = process.env[k]

      if (/^INPUT_/i.test(k)) {
        debug[k] = process.env[k]
      }
    }
  }

  for (const item of items) {
    const [repository, ref, ...a] = item.split('@')
    const [owner, name, ...b] = repository.split('/')

    if (!owner || !name || a.length || b.length) {
      throw new Error('Repository must be in the form of "owner/name[@ref]"')
    }

    console.log('::group::Checkout %s', item)
    console.log(require('util').inspect({ repository, ref, owner, name, debug }, { depth: null }))

    await exec(process.execPath, [checkout], {
      env: {
        ...env,
        INPUT_REPOSITORY: repository,
        INPUT_REF: ref || '',
        INPUT_PATH: path.join(basedir, repository),
        'INPUT_PERSIST-CREDENTIALS': 'false',

        // To be safe, unset variables that might be used as defaults
        GITHUB_REPOSITORY: '',
        GITHUB_SHA: '',
        GITHUB_REF: '',
        GITHUB_HEAD_REF: '',
        GITHUB_BASE_REF: ''
      },
      stdio: ['ignore', 1, 1]
    })

    console.log('::endgroup::')
  }
}

main()

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
